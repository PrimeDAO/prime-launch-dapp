import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Utils } from "services/utils";
import "./navbar.scss";

const DEV_ADDRESSES = [
  "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1",
];

const IS_PRODUCTION_APP = process.env.NODE_ENV === "production";

@autoinject
export class Navbar {
  menuOpen = false;
  private seedJsonFiles: File[]
  private showDevCode = false;

  constructor(private router: Router, private eventAggregator: EventAggregator) {}

  bind(): void {
    this.eventAggregator.subscribe("Network.Changed.Account", (account: string) => {
      if (IS_PRODUCTION_APP) return;

      const isDevAccount = DEV_ADDRESSES.find(address => address.toLowerCase() === account.toLowerCase());

      if (isDevAccount) {
        this.showDevCode = true;
        return;
      }

      this.showDevCode = false;
    });
  }

  private toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  private goto(url: string): void {
    this.menuOpen = false;
    Utils.goto(url);
  }

  private navigate(href: string): void {
    this.menuOpen = false;
    this.router.navigate(href);
  }

  private async dev_uploadSeed(): Promise<void> {
    const seedData = await this.seedJsonFiles[0].text();
    const seedJson = JSON.parse(seedData);
    this.eventAggregator.publish("dev:upload-seed", seedJson);
  }

}
