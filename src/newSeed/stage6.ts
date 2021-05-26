import { autoinject } from "aurelia-framework";
import { BaseStage } from "newSeed/baseStage";
import { Router } from "aurelia-router";
import { SeedService } from "services/SeedService";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { fromWei, toWei } from "services/EthereumService";
import { NumberService } from "services/numberService";

@autoinject
export class Stage6 extends BaseStage {

  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private seedService: SeedService,
    private numberService: NumberService) {
    super(router, eventAggregator);
  }

  attached(): void {
    // this.seedConfig.seedDetails.fundingMax = toWei("100").toString();
    // this.seedConfig.seedDetails.pricePerToken = toWei(".5").toString();
    // this.wizardState.seedTokenSymbol = "PRIME";
    const distributableSeeds = this.numberService.fromString(fromWei(this.seedConfig.seedDetails.fundingMax))
      / this.numberService.fromString(fromWei(this.seedConfig.seedDetails.pricePerToken));
    this.wizardState.requiredSeedFee = distributableSeeds * this.seedFee;
    this.wizardState.requiredSeedDeposit = distributableSeeds + this.wizardState.requiredSeedFee;
  }

  async submit(): Promise<void> {
    try {
      this.eventAggregator.publish("seed.creating", true);
      this.wizardState.seedHash = await this.seedService.deploySeed(this.seedConfig);
      // this.eventAggregator.publish("handleInfo", `Successfully pinned seed registration hash at: https://gateway.pinata.cloud/ipfs/${this.seedHash}`);
      this.next();
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("seed.creating", false);
    }
  }
}
