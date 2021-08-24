import { EthereumService } from "services/EthereumService";
import { Seed } from "entities/Seed";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import "./adminDashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { EventConfigException } from "services/GeneralEvents";
import { Utils } from "services/utils";

@autoinject
export class AdminDashboard {

  seeds: Array<Seed> = [];
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
      this.seeds = this.seedService.seedsArray
        .filter((seed) => { return seed.admin.toLowerCase() === defaultAccount;});
    } else {
      this.seeds = [];
    }
  }

  connect():void {
    this.ethereumService.ensureConnected();
  }
}
