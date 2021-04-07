import { SeedService } from "services/SeedService";
import { bindable } from "aurelia-typed-observable-plugin";
import { Address } from "services/EthereumService";
import "./seedDashboard.scss";
import { Seed } from "entities/Seed";

export class SeedDashboard {
  @bindable address: Address;

  seed: Seed;

  constructor(
    private seedService: SeedService,
  ) {}

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
  }

  async attached(): Promise<void> {
    await this.seedService.ensureInitialized();
    this.seed = this.seedService.seeds.get(this.address);
  }
}
