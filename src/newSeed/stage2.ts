import { BaseStage } from "newSeed/baseStage";

export class Stage2 extends BaseStage {
  proceed(): void {
    let message: string;

    if (!this.seedConfig?.projectDetails?.summary) {
      message = "Please Enter a summary of the Project";
    }
    else if (!this.seedConfig?.projectDetails?.proposition) {
      message = "Please enter a propostion";
    } else if (!this.seedConfig.projectDetails.category) {
      message = "Please provide a category";
    }

    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }
}
