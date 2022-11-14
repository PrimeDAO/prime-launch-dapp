import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Utils } from "services/utils";
import "./navbar.scss";

@autoinject
export class Navbar {
  menuOpen = false;
  private seedJsonFiles: File[]
  private showDevCode = false;

  constructor(private router: Router, private eventAggregator: EventAggregator) {}

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
