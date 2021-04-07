import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { Address } from "services/EthereumService";

@singleton(false)
@autoinject
export class Home {

  seeingMore = false;
  bookmark: string;
  seeds: Array<Seed>;
  featuredSeed: Address;

  constructor(
    private router: Router,
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
  ) {
  }

  async activate(params: { bookmark?: string}): Promise<void> {
    this.bookmark = params?.bookmark;
  }

  async attached(): Promise<void> {
    if (this.bookmark) {
      document.getElementById(this.bookmark).scrollIntoView();
      this.bookmark = undefined;
    }

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

    // TODO:  get featured seed from somewhere....
    this.featuredSeed = this.seeds?.[0].address;
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }

  seeMore(yesNo: boolean): void {
    this.seeingMore = yesNo;
  }
}
