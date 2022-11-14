import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Utils } from "services/utils";
import "./navbar.scss";

export const DEV_ADDRESSES = [
  "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1",
  "0xE834627cDE2dC8F55Fe4a26741D3e91527A8a498",
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
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

  private __dev_toNewDashboard(): void {
    const seedHash = this.router.currentInstruction.params.address;
    this.router.navigate(`seed-sale/${seedHash}`);
  }

  private __dev_toOldDashboard(): void {
    const seedHash = this.router.currentInstruction.params.address;
    this.router.navigate(`seed/${seedHash}`);
  }

}
