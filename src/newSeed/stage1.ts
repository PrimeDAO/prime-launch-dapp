import { BaseStage } from "./baseStage";
// Let's import the utils helper
import {Utils} from "../services/utils";
export class Stage1 extends BaseStage {
  proceed(): void {
    let message: string;

    if (!this.seedConfig?.general?.projectName) {
      message = "Please Enter a value for Project Name";
    }
    else if (!Utils.isValidUrl(this.seedConfig?.general?.projectWebsite, false)) {
      message = "Please enter a valid url for project website";
    }
    else if (!this.seedConfig?.general?.category) {
      message = "Enter a category";
    } else if (!Utils.isValidUrl(this.seedConfig?.general?.whitepaper, false)) {
      message = "Please enter a valid url for whitepaper";
    } else if (!Utils.isValidUrl(this.seedConfig?.general?.github, false)) {
      message = "Please enter a valid url for github link";
    }
    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }
}
