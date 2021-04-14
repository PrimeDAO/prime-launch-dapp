import { BaseStage } from "./baseStage";
// Let's import the utils helper
import {Utils} from "../services/utils";
export class Stage1 extends BaseStage {
  proceed(): void {
    let message: string;

    if (!this.seedConfig?.general?.projectName) {
      message = "Enter a value for Project Name";
    }
    else if (!this.seedConfig?.general?.projectWebsite) {
      message = "Plese enter the projec website";
    } else if (!Utils.isValidUrl(this.seedConfig?.general?.projectWebsite, false)) {
      message = "Please enter a valid website url";
    }
    else if (!this.seedConfig?.general?.category) {
      message = "Enter a category";
    } else if (!this.seedConfig?.general?.whitepaper) {
      message = "We need your whitepaper address";
    } else if (!Utils.isValidUrl(this.seedConfig?.general?.whitepaper, false)) {
      message = "Please enter a valid website url";
    } else if (!this.seedConfig?.general?.github) {
      message = "Please put in a github link";
    } else if (!Utils.isValidUrl(this.seedConfig?.general?.github, false)) {
      message = "Please enter a valid website url";
    }
    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }
}
