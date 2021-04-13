import { BaseStage } from "./baseStage";

export class Stage1 extends BaseStage {
  proceed(): void {
    let message: string;

    if (!this.seedConfig?.general?.projectName) {
      message = "Enter a value for Project Name";
    }
    else if (!this.seedConfig?.general?.projectWebsite) {
      message = "Plese enter the projec website";
    } else if (!this.seedConfig?.general?.category) {
      message = "Enter a category";
    } else if (!this.seedConfig?.general?.whitepaper) {
      message = "We need your whitepaper address";
    } else if (!this.seedConfig?.general?.github) {
      message = "Please put in a github link";
    }
    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }
}
