import { EthereumService } from "services/EthereumService";
import { Seed } from "entities/Seed";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import "./adminDashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { throwIfEmpty } from "rxjs/operators";

@autoinject
export class AdminDashboard {

  seeds: Array<Seed>;
  subscriptions: DisposableCollection = new DisposableCollection();

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
      this.seeds = await this.seedService.seedsArray
        .filter((seed) => seed.admin === this.ethereumService.defaultAccountAddress);
    }));
  }

  async activate(): Promise<void> {
    await this.seedService.ensureInitialized();
    if (this.ethereumService.defaultAccountAddress) {
      this.seeds = await this.seedService.seedsArray
        .filter((seed) => seed.admin === this.ethereumService.defaultAccountAddress);
    }
  }

  // attached() {

  // }

  connect():void {
    this.ethereumService.ensureConnected();
  }
}
