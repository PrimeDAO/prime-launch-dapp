import { EventAggregator } from "aurelia-event-aggregator";
import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";

@singleton(false)
@autoinject
export class Home {

  featuredSeeds: Array<Seed> = null;
  subscriberEmail: string;

  constructor(
    private router: Router,
    private seedService: SeedService,
    private eventAggregator: EventAggregator,
  ) {
  }

  attached(): void {
    this.seedService.getFeaturedSeeds().then((seeds) => {
      this.featuredSeeds = seeds;
    });
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }

  subscribe(): void {
    if (!Utils.isValidEmail(this.subscriberEmail)) {
      this.eventAggregator.publish("handleValidationError", "Please enter a valid email address");
    } else {
      // window.open(`mailto:renc@curvelabs.eu?subject=Sign-up%20for%20Prime%20Launch%20Newsletter&body=My%20email%20address: ${this.subscriberEmail}`, "#", "noopener noreferrer");
    }
  }}
