import { autoinject } from "aurelia-framework";
import { DateService } from "services/DateService";
import { SeedService } from "services/SeedService";
import { bindable } from "aurelia-typed-observable-plugin";
import { Address } from "services/EthereumService";
import "./seedDashboard.scss";
import { Seed } from "entities/Seed";

@autoinject
export class SeedDashboard {
  @bindable address: Address;

  seed: Seed;
  loading = true;
  startsInDaysString: string;

  constructor(
    private seedService: SeedService,
    private dateService: DateService,
  ) {}


  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
  }

  async attached(): Promise<void> {
    await this.seedService.ensureInitialized();
    this.seed = this.seedService.seeds.get(this.address);
    this.seed.ensureInitialized().then(() => {
      this.loading = false;
      this.startsInDaysString = this.dateService.ticksToTimeSpanString(this.seed.startsInDays);
    });
  }
}
