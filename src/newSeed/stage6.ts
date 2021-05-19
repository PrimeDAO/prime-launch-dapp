import { autoinject } from "aurelia-framework";
import { BaseStage } from "newSeed/baseStage";
import { Router } from "aurelia-router";
import { SeedService } from "services/SeedService";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";

@autoinject
export class Stage6 extends BaseStage {
  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private seedService: SeedService) {
    super(router, eventAggregator);
  }

  async submit(): Promise<void> {
    try {
      this.eventAggregator.publish("seed.creating", true);
      this.stageStates[this.stageNumber+1].seedHash = await this.seedService.deploySeed(this.seedConfig);
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
