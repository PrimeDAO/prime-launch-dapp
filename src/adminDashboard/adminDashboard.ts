import { TransactionReceipt } from 'services/TransactionsService';
import { Seed } from './../entities/Seed';
import { Address, EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import "./adminDashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { EventConfigException } from "services/GeneralEvents";
import { WhiteListService } from 'services/WhiteListService';
import axios from 'axios';
import TransactionsService from 'services/TransactionsService';

@autoinject
export class AdminDashboard {

  seeds: Array<Seed> = [];
  selectedSeed: Seed;
  addressToRemove: String = '';
  addressToAdd: String = '';
  receiverAddress: String = '';
  subscriptions: DisposableCollection = new DisposableCollection();
  loading: boolean = true;

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private ethereumService: EthereumService,
    private whiteListService: WhiteListService,
    private transactionsService: TransactionsService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async () => {
      this.hydrate();
    }));
  }

  async attached(): Promise<void> {

    try {
      if (this.seedService.initializing) {
        this.eventAggregator.publish("seeds.loading", true);
        await this.seedService.ensureAllSeedsInitialized();
      }
      await this.hydrate();

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("seeds.loading", false);
      this.loading = false;
    }
  }

  async hydrate(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      const defaultAccount: Address = this.ethereumService.defaultAccountAddress.toLowerCase();
      this.seeds = this.seedService.seedsArray
        .filter((seed) => { return seed.admin.toLowerCase() === defaultAccount;});;
    } else {
      this.seeds = [];
    }
  }

  setSeed(index): void {
    this.selectedSeed = this.seeds[index];
    console.log(this.selectedSeed);
  }

  async addWhitelist(): Promise<TransactionReceipt> {
    const whitelistAddress: Set<Address> = await this.whiteListService.getWhiteList(this.selectedSeed.metadata.seedDetails.whitelist);
    return await this.selectedSeed.addWhitelist(whitelistAddress);
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
