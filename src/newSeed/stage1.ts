import { BaseStage } from "./baseStage";
// Let's import the utils helper
import {Utils} from "../services/utils";
export class Stage1 extends BaseStage {
  proceed(): void {
    let message: string;
    if (!this.seedConfig?.stage1?.projectName) {
      message = "Please Enter a value for Project Name";
    }
    else if (!Utils.isValidUrl(this.seedConfig?.stage1?.projectWebsite, false)) {
      message = "Please enter a valid url for project website";
    }
    else if (!this.seedConfig?.stage1?.category) {
      message = "Please Enter a category";
    } else if (!Utils.isValidUrl(this.seedConfig?.stage1?.whitepaper, false)) {
      message = "Please enter a valid url for whitepaper";
    } else if (!Utils.isValidUrl(this.seedConfig?.stage1?.github, false)) {
      message = "Please enter a valid url for github link";
    }
    if (message) {
      this.validationError(message);
    } else {
      // Set this page as verified
      this.seedConfig.stage1.verified = true;
      this.next();
    }
  }
}
