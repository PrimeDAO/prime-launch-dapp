import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";

@singleton(false)
@autoinject
export class Home {

  seeingMore = false;
  bookmark: string;
  featuredSeeds: Array<Seed>;
  subscriberEmail: string;

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

    if (!this.featuredSeeds?.length) {
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

    this.featuredSeeds = this.seedService.featuredSeeds;
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }

  subscribe(): void {
    if (!Utils.isValidEmail(this.subscriberEmail)) {
      this.eventAggregator.publish("handleValidationError", "Please enter a valid email address");
    } else {
      window.open(`mailto:renc@curvelabs.eu?subject=Sign-up%20for%20Prime%20Launch%20Newsletter&body=My%20email%20address: ${this.subscriberEmail}`, "#", "noopener noreferrer");
    }
  }
}
