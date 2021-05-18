import { BaseStage } from "newSeed/baseStage";
import { Utils } from "services/utils";

export class Stage5 extends BaseStage {

  isValidFile(file: string): boolean {
    const re = /(\.jpg|\.bmp|\.gif|\.png)$/i;
    return re.test(String(file).toLowerCase());
  }

  proceed(): void {
    let message = this.validateInputs();
    if (message) {
      this.validationError(message);
      this.stageStates[this.stageNumber].verified = false;
    } else {
      // Check every stage to make sure they are validated
      this.stageState.verified = true;

      for (let i = 1; i < this.stageStates.length - 1; ++i) {
        if (!this.stageStates[i].verified) {
          message = `Please review step ${i} - ${this.stageStates[i].title}`;
        }
      }
      if (message) {
        this.validationError(message);
        return;
      }
      this.next();
    }
  }

  validateInputs(): string {
    let message: string;
    // Validate current stage
    // TODO: Check if there is an email validator
    if (!Utils.isValidEmail(this.seedConfig.contactDetails.contactEmail, false)) {
      message = "Please enter a valid email address for Contact Email";
    } else if (!Utils.isValidUrl(this.seedConfig.contactDetails.logo)) {
      message = "Please supply a valid image file type for Project Logo";
    } else if (!this.isValidFile(this.seedConfig.contactDetails.logo)) {
      message = "Please enter a valid url for Project Logo";
    }
    return message;
  }
}
