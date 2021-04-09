import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { bindable } from "aurelia-typed-observable-plugin";
import { Seed } from "entities/Seed";
import { DateService } from "services/DateService";
import { Address } from "services/EthereumService";
import { SeedService } from "services/SeedService";
import "./launchSummary.scss";

@autoinject
export class LaunchSummary {

  @bindable address: Address;
  seed: Seed;
  loading = true;
  startsInDaysString: string;

  constructor(
    private router: Router,
    private dateService: DateService,
    private seedService: SeedService,
  ) {}

  async attached(): Promise<void> {
    await this.seedService.ensureInitialized();
    this.seed = this.seedService.seeds.get(this.address);
    this.seed.ensureInitialized().then(() => {
      this.loading = false;
      this.startsInDaysString = this.dateService.ticksToTimeSpanString(this.seed.startsInDays);
    } );
  }

  gotoDashboard(): void {
    this.router.navigate(`seed/${this.address}`);
  }
}
