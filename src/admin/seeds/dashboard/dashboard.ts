import { Utils } from "services/utils";
import { TransactionReceipt } from "services/TransactionsService";
import { Seed } from "entities/Seed";
import { Address, EthereumService, toWei } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { EventConfigException } from "services/GeneralEvents";
import { WhiteListService } from "services/WhiteListService";
import { BigNumber } from "ethers";
import { Router } from "aurelia-router";
import { AddClassService } from "services/AddClassService";
import { IContributorClass } from "entities/Seed";
import { parseUnits } from "ethers/lib/utils";
import { ConsoleLogService } from "services/ConsoleLogService";
import { BigNumberService } from "services/BigNumberService";

@autoinject
export class SeedAdminDashboard {

  seeds: Array<Seed> = [];
  defaultSeedAddress: Address;
  selectedSeed: Seed;
  selectedSeedIndex: number;
  addressToRemove = "";
  addressToAdd = "";
  receiverAddress = "";
  subscriptions: DisposableCollection = new DisposableCollection();
  loading = true;
  newlyAddedClassesIndexes: number[] = [];
  classesBeforeEditMap: Map<number, IContributorClass> = new Map()
  isMinting: Record<number, boolean> = {};

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  @computedFrom("selectedSeed")
  get retrievableProjectTokenAmount(): BigNumber {
    if (!this.selectedSeed.address) {
      return BigNumber.from(0);
    }
    const tokenToBeDistributed = this.selectedSeed.seedAmountRequired.sub(this.selectedSeed.seedRemainder).sub(this.selectedSeed.feeRemainder);
    return this.selectedSeed.minimumReached ?
      this.selectedSeed.projectTokenBalance.sub(tokenToBeDistributed) :
      this.selectedSeed.projectTokenBalance;
  }

  @computedFrom("selectedSeed.hasNotStarted")
  get disableClassInteraction(): boolean {
    const disable = !this.selectedSeed.hasNotStarted;
    return disable;
  }

  @computedFrom("noAdditions", "hasEditedClasses", "isMinting[-1]")
  get allowConfirmOrCancel(): boolean {
    const allow = (!this.noAdditions || this.hasEditedClasses) || !!this.isMinting[-1];
    return allow;
  }

  @computedFrom("classesBeforeEditMap.size")
  get hasEditedClasses(): boolean {
    const disable = this.classesBeforeEditMap.size > 0;
    return disable;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private ethereumService: EthereumService,
    private whiteListService: WhiteListService,
    private router: Router,
    private addClassService: AddClassService,
    private consoleLogService: ConsoleLogService,
    private bigNumberService: BigNumberService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async () => {
      this.hydrate();
    }));
  }

  async activate(params: { address: Address }): Promise<void> {
    this.defaultSeedAddress = params?.address;
  }

  async attached(): Promise<void> {
    try {
      if (this.seedService.initializing) {
        this.eventAggregator.publish("launches.loading", true);
        await this.seedService.ensureAllSeedsInitialized();
      }
      await this.hydrate();
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("launches.loading", false);
      this.loading = false;
    }
  }

  async hydrate(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      const defaultAccount: Address = this.ethereumService.defaultAccountAddress.toLowerCase();
      this.seeds = this.seedService.seedsArray
        .filter((seed) => { return seed.admin.toLowerCase() === defaultAccount;});
      if (this.seeds.length === 1){
        this.selectedSeed = this.seeds[0];
        this.selectedSeedIndex = 0;
      }
    } else {
      this.seeds = [];
    }
    if (this.defaultSeedAddress) {
      const defaultSeed = this.seeds.filter((seed) => this.defaultSeedAddress === seed.address);
      if (defaultSeed.length === 1) {
        this.selectedSeedIndex = this.seeds.indexOf(defaultSeed[0]);
        this.selectedSeed = defaultSeed[0];
      }
    }
  }

  @computedFrom("selectedSeed.isDead")
  get isDead(): boolean {
    return this.selectedSeed.isDead;
  }

  selectSeed(index: number): void {
    this.selectedSeed = this.seeds[index];
    this.selectedSeedIndex = index;
    this.router.navigate(`admin/seeds/dashboard/${this.selectedSeed.address}`);
  }

  private hasValidatedAddress(address:Address, message: string): boolean {
    if (!Utils.isAddress(address)){
      this.eventAggregator.publish("handleValidationError", message);
      return false;
    }
    return true;
  }

  addToWhiteList(): void {
    if (this.hasValidatedAddress(this.addressToAdd, "Please supply a valid address to add to whitelist")) {
      this.selectedSeed.addToWhitelist(this.addressToAdd);
    }
  }

  removeFromWhiteList(): void {
    if (this.hasValidatedAddress(this.addressToRemove, "Please supply a valid address to remove from whitelist")) {
      this.selectedSeed.removeFromWhitelist(this.addressToRemove);
    }
  }

  retrieveProjectTokens(): void {
    if (this.hasValidatedAddress(this.receiverAddress, "Please supply a valid address to receive project tokens")) {
      this.selectedSeed.retrieveProjectTokens(this.receiverAddress);
    }
  }

  async addWhitelist(): Promise<TransactionReceipt> {
    const whitelistAddress: Set<Address> = await this.whiteListService.getWhiteList(this.selectedSeed.metadata.launchDetails.whitelist);
    return await this.selectedSeed.addWhitelist(whitelistAddress);
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  private navigate(href: string): void {
    this.router.navigate(href);
  }

  addClass(newClass: IContributorClass): void {
    if (!this.selectedSeed.classes) this.selectedSeed.classes = [];
    this.selectedSeed.classes.push(newClass);
    this.newlyAddedClassesIndexes.push(this.selectedSeed.classes.length - 1);
  }

  editClass({ index, editedClass }: { index: number, editedClass: IContributorClass; }): void {
    const oldClass = {...this.selectedSeed.classes[index]};
    this.classesBeforeEditMap.set(index, oldClass); // Store old class data
    Object.assign(this.selectedSeed.classes[index], editedClass); // Update new class data
  }

  async new_deployClassesToContract(): Promise<void> {
    if (!this.allowConfirmOrCancel) return;

    if (!this.noAdditions) {
      this.deployClassesToContract();
    } else if (this.hasEditedClasses) {
      this.batchEditClasses();
    }
  }

  async batchEditClasses(): Promise<void> {
    /**
      Otherwise update changes in the contract directly after edit
     */
    try {
      const editedIndexes: string[] = [];
      const editedClassNames: string[] = [];
      const editedClassCaps: BigNumber[] = [];
      const editedIndividualCaps: BigNumber[] = [];
      const editedClassVestingDurations: number[] = [];
      const editedClassVestingCliffs: number[] = [];

      /**
       * From `classesBeforeEditMap`, we know which classes changed.
       * Iterate and assign to "edited" arrays, to be sent to the contract
       */
      this.classesBeforeEditMap.forEach((_, classIndex) => {
        const changedClass = this.selectedSeed.classes[classIndex];

        editedIndexes.push(classIndex.toString());
        editedClassNames.push(changedClass.className);
        editedClassCaps.push(changedClass.classCap);
        editedIndividualCaps.push(changedClass.individualCap);
        editedClassVestingDurations.push(changedClass.classVestingDuration);
        editedClassVestingCliffs.push(changedClass.classVestingCliff);
      });

      this.isMinting[-1] = true;
      const receipt = await this.selectedSeed.changeClass({
        editedIndexes,
        editedClassNames,
        editedClassCaps,
        editedIndividualCaps,
        editedClassVestingDurations,
        editedClassVestingCliffs,
      });
      if (receipt) {
        this.resetClassesBeforeEdit();
        this.eventAggregator.publish("handleInfo", "Successfully saved changes to the contract.");
      }
    } catch (ex) {
      this.revertEditedClassesBack();
      this.eventAggregator.publish("handleException", "Error trying to save changes to the contract.");
      this.consoleLogService.logMessage(`Error executing 'edit class': ${ex.message}`);
    } finally {
      this.isMinting[-1] = false;
    }
  }

  openAddClassModal(index: number = null): void {
    if (this.isMinting[-1]) return;
    if (this.disableClassInteraction) return;

    const editedClass = index !== null ? { ...this.selectedSeed.classes[index] } : undefined;
    this.addClassService.show(
      { index, editedClass, hardCap: this.selectedSeed.cap, fundingTokenInfo: this.selectedSeed.fundingTokenInfo, seed: this.selectedSeed },
      this.addClass.bind(this),
      this.editClass.bind(this),
    );
  }

  @computedFrom("newlyAddedClassesIndexes.length")
  get noAdditions(): boolean {
    return !this.newlyAddedClassesIndexes.length;
  }

  async deployClassesToContract(): Promise<void> {
    const classNames: string[] = [];
    const classCaps: BigNumber[] = [];
    const individualCaps: BigNumber[] = [];
    const classVestingDurations: number[] = [];
    const classVestingCliffs: number[] = [];

    if (this.noAdditions || this.isMinting[-1]) return;

    this.newlyAddedClassesIndexes.forEach((index) => {
      const contributorClass: IContributorClass = this.selectedSeed.classes[index];

      classNames.push(contributorClass.className);
      classCaps.push(contributorClass.classCap);
      individualCaps.push(contributorClass.individualCap);
      classVestingDurations.push(contributorClass.classVestingDuration);
      classVestingCliffs.push(contributorClass.classVestingCliff);
    });

    try {
      this.isMinting[-1] = true;
      const receipt = await this.selectedSeed.addClassBatch({
        classNames,
        classCaps,
        individualCaps,
        classVestingDurations,
        classVestingCliffs,
      });
      if (receipt) {
        this.eventAggregator.publish("handleInfo", "Successfully added changes to the contract.");
        // Reset count.
        this.newlyAddedClassesIndexes = [];
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      this.consoleLogService.logMessage(`Error executing 'add classes': ${ex.message}`);
    } finally {
      this.isMinting[-1] = false;
    }
  }

  cancel() {
    if (!this.allowConfirmOrCancel) return;

    if (this.hasEditedClasses) {
      this.revertEditedClassesBack();
    } else if (!this.noAdditions) {
      const firstNewlyAddedClass = this.newlyAddedClassesIndexes[0];
      this.selectedSeed.classes.splice(firstNewlyAddedClass);
      this.newlyAddedClassesIndexes = [];
    }
  }

  /**
   * From the `classesBeforeEditMap` var, revert classes to before any edition was done
   */
  private revertEditedClassesBack(): void {
    this.classesBeforeEditMap.forEach((uneditedClasses, classIndex) => {
      Object.assign(this.selectedSeed.classes[classIndex], uneditedClasses);
    });

    this.resetClassesBeforeEdit();
  }

  private resetClassesBeforeEdit(): void {
    this.classesBeforeEditMap = new Map();
  }
}
