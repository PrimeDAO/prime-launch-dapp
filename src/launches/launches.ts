import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./launches.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";

@singleton(false)
@autoinject
export class Launches {

  seeds: Array<Seed>;
  featuredSeeds: Array<Seed>;
  seeingMore: boolean;

  constructor(
    private router: Router,
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
  ) {
  }

  async attached(): Promise<void> {
    if (!this.seeds?.length) {
      try {
        if (this.seedService.initializing) {
          await Utils.sleep(200);
          this.eventAggregator.publish("seeds.loading", true);
          await this.seedService.ensureInitialized();
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        this.eventAggregator.publish("seeds.loading", false);
      }
    }

    this.seeds = this.seedService.seedsArray;
    this.featuredSeeds = this.seedService.featuredSeeds;
  }

  navigate(seed: Seed): void {
    if (seed.hasSeedTokens) {
      this.router.navigate(`seed/${seed.address}`);
    }
  }

  seeMore(yesNo: boolean): void {
    this.seeingMore = yesNo;
  }
}
