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

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private ethereumService: EthereumService,
    private whiteListService: WhiteListService,
    private router: Router,
    private addClassService: AddClassService,
    private consoleLogService: ConsoleLogService,
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

  async editClass({ index, editedClass }: { index: number, editedClass: IContributorClass; }): Promise<void> {
    if (!this.noAdditions) {
      /**
       * Apply changes to newly added classes without storing in the contract
       */
      Object.assign(this.selectedSeed.classes[index], editedClass);
      return;
    }
    /**
      Otherwise update changes in the contract directly after edit
     */
    try {
      const receipt = await this.selectedSeed.changeClass({
        classIndex: index,
        className: editedClass.className,
        classCap: editedClass.classCap,
        individualCap: editedClass.individualCap,
        price: editedClass.price,
        classVestingDuration: editedClass.classVestingDuration,
        classVestingCliff: editedClass.classVestingCliff,
        classFee: BigNumber.from(0),
      });
      if (receipt) {
        Object.assign(this.selectedSeed.classes[index], editedClass);
        this.eventAggregator.publish("handleInfo", "Successfully saved changes to the contract.");
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", "Error trying to save changes to the contract.");
      this.consoleLogService.logMessage(`Error executing 'edit class': ${ex.message}`);
    }
  }

  openAddClassModal(index: number = null): void {
    const editedClass = index !== null ? { ...this.selectedSeed.classes[index] } : undefined;
    this.addClassService.show(
      { index, editedClass, hardCap: this.selectedSeed.cap, fundingTokenInfo: this.selectedSeed.fundingTokenInfo },
      this.addClass.bind(this),
      this.editClass.bind(this),
    );
  }

  @computedFrom("newlyAddedClassesIndexes.length")
  get noAdditions(): boolean {
    return !this.newlyAddedClassesIndexes.length;
  }

  async deployClassesToContract() {
    // TODO: Add deployment logic
    // Differentiate between edited and newly added classes.
    // Step 1: Deploy batched classes
    // Step 2: Deploy bached Allowed Lists corresponding to the classes
    const classNames: string[] = [];
    const classCaps: BigNumber[] = [];
    const individualCaps: BigNumber[] = [];
    const prices: string[] = [];
    const classVestingDurations: number[] = [];
    const classVestingCliffs: number[] = [];
    const classFees: BigNumber[] = [];

    if (this.noAdditions) return;

    this.newlyAddedClassesIndexes.forEach((index) => {
      const contributorClass: IContributorClass = this.selectedSeed.classes[index];

      classNames.push(contributorClass.className);
      classCaps.push(contributorClass.classCap);
      individualCaps.push(contributorClass.individualCap);

      const price = parseUnits(
        "0.01",
        parseInt("6") - parseInt("18") + 18,
        // parseInt(fundingTokenDecimal) - parseInt(seedTokenDecimal) + 18,
      ).toString();
      prices.push(price); // Temporary;

      classVestingDurations.push(contributorClass.classVestingDuration);
      classVestingCliffs.push(contributorClass.classVestingCliff);
      classFees.push(BigNumber.from(0));
    });

    try {
      const receipt = await this.selectedSeed.addClassBatch({
        classNames,
        classCaps,
        individualCaps,
        prices,
        classVestingDurations,
        classVestingCliffs,
        classFees,
      });
      if (receipt) {
        this.eventAggregator.publish("handleInfo", "Successfully added changes to the contract.");
        // Reset count.
        this.newlyAddedClassesIndexes = [];
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      this.consoleLogService.logMessage(`Error executing 'add classes': ${ex.message}`);
    }
  }

  cancel() {
    // TODO: Add cancel logic.
    // Remove new add classes
    // Undo edit
    this.selectedSeed.classes = []; /* <- Temporary */
  }
}
