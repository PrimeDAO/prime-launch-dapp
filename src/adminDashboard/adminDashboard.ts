import BigNumber from '../services/BigNumberService';
import { Seed } from './../entities/Seed';
import { Address, EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import "./adminDashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { EventConfigException } from "services/GeneralEvents";
import { Utils } from "services/utils";
import axios from 'axios';

@autoinject
export class AdminDashboard {

  seeds: Array<Seed> = [];
  selectedSeed: Seed;
  addressToRemove: String = '';
  addressToAdd: String = '';
  receiverAddress: String = '';
  subscriptions: DisposableCollection = new DisposableCollection();
  loading = true;

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private ethereumService: EthereumService,
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
      const defaultAccount = this.ethereumService.defaultAccountAddress.toLowerCase();
      this.seeds = this.seedService.seedsArray;
    } else {
      this.seeds = [];
    }
  }

  async setSeed(index) {
    this.selectedSeed = this.seeds[index];
  }

  async fundSeed() {
    try {
      await this.selectedSeed.projectTokenContract.transfer(this.selectedSeed.address, this.selectedSeed.seedAmountRequired);
    } catch (error) {
      alert(error.message);
    }
  }

  async retrieveProjectTokens(receiver: Address) {
    try {
      await this.selectedSeed.contract.callStatic.retrieveSeedTokens(receiver);
      await this.selectedSeed.contract.retrieveSeedTokens(receiver);
    } catch (error) {
      alert(error.message);
    }
  }

  async withdrawFundingTokens() {
    try {
      await this.selectedSeed.contract.callStatic.withdraw();
      await this.selectedSeed.contract.withdraw();
    } catch (error) {
      alert(error.message);
    }
  }

  async addWhitelist() {
    try {
      const filterPattern = /([^\W]+)/g;
      const response = await axios.get(this.selectedSeed.metadata.seedDetails.whitelist);
      const whitelistAddress = response.data.match(filterPattern);
      await this.selectedSeed.contract.callStatic.whitelistBatch(whitelistAddress);
      await this.selectedSeed.contract.whitelistBatch(whitelistAddress);
    } catch (error) {
      alert(error.message);
    }
  }

  async addToWhitelist(address: Address) {
    try {
      await this.selectedSeed.contract.callStatic.whitelist(address);
      await this.selectedSeed.contract.whitelist(address);
    } catch (error) {
      alert(error.message);
    }
  }

  async removeFromWhiteliste(address: Address) {
    try {
      await this.selectedSeed.contract.callStatic.unwhitelist(address);
      await this.selectedSeed.contract.unwhitelist(address);
    } catch (error) {
      alert(error.message);
    }
  }

  async pauseLaunch() {
    try {
      await this.selectedSeed.contract.callStatic.pause();
      await this.selectedSeed.contract.pause();
    } catch (error) {
      alert(error.message);
    }
  }

  async unpauseLaunch() {
    try {
      await this.selectedSeed.contract.callStatic.unpause();
      await this.selectedSeed.contract.unpause();
    } catch (error) {
      alert(error.message);
    }
  }

  async closeLaunch() {
    try {
      await this.selectedSeed.contract.callStatic.close();
      await this.selectedSeed.contract.close();
    } catch (error) {
      alert(error.message);
    }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
