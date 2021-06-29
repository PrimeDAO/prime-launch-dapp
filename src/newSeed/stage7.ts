import { autoinject } from "aurelia-framework";
import { BaseStage } from "newSeed/baseStage";

@autoinject
export class Stage7 extends BaseStage {
  attached(): void {
    this.seedConfig.clearState();
    this.stageStates.forEach((stage: { verified: boolean }, index: number) => {
      if (index > 0) {
        stage.verified = false;
      }
    });
  }
}
