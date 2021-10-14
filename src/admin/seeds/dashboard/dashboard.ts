import { Utils } from "services/utils";
import { TransactionReceipt } from "services/TransactionsService";
import { Seed } from "entities/Seed";
import { Address, EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { EventConfigException } from "services/GeneralEvents";
import { WhiteListService } from "services/WhiteListService";
import { AddressValidationMessages, DashboardActions } from "admin/enums/dashboard";

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
  actions = DashboardActions

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private ethereumService: EthereumService,
    private whiteListService: WhiteListService,
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
      const defaultSeedIndex = this.seeds.map((seed, index) => this.defaultSeedAddress === seed.address ? index : undefined).filter((seed) => seed);
      if (defaultSeedIndex.length === 1) {
        this.selectedSeedIndex = defaultSeedIndex[0];
        this.selectedSeed = this.seeds[defaultSeedIndex[0]];
      }
    }
  }

  selectSeed(index: number): void {
    this.selectedSeed = this.seeds[index];
    this.selectedSeedIndex = index;
  }


  private hasValidatedAddress(address:Address, message:AddressValidationMessages): boolean {
    if (!Utils.isAddress(address)){
      this.eventAggregator.publish("handleValidationError", message);
      return false;
    }
    return true;
  }

  addressActionsHandler(action:DashboardActions, address:Address):void {
    if (!action || !address) {
      return;
    }

    switch (action) {
      case DashboardActions.AddToWhiteList:
        if (this.hasValidatedAddress(address, AddressValidationMessages.InvalidAddToWhiteList)) {
          this.selectedSeed.addToWhitelist(address);
        }
        break;
      case DashboardActions.RemoveFromWhiteList:
        if (this.hasValidatedAddress(address, AddressValidationMessages.InvalidRemoveFromWhiteList)) {
          this.selectedSeed.removeFromWhitelist(address);
        }
        break;
      case DashboardActions.RetrieveProjectToken:
        if (this.hasValidatedAddress(address, AddressValidationMessages.InvalidRetrieveProjectToken)) {
          this.selectedSeed.retrieveProjectTokens(address);
        }
        break;
      default:
        this.hasValidatedAddress(address, AddressValidationMessages.InvalidAddress);
        break;
    }
  }

  async addWhitelist(): Promise<TransactionReceipt> {
    const whitelistAddress: Set<Address> = await this.whiteListService.getWhiteList(this.selectedSeed.metadata.launchDetails.whitelist);
    return await this.selectedSeed.addWhitelist(whitelistAddress);
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
