import { BaseStage } from "newSeed/baseStage";
import { Utils } from "services/utils";

export class Stage5 extends BaseStage {

  isValidEmail(email: string, emptyOk: boolean): boolean {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return (emptyOk && (!email || !email.trim())) || (email && re.test(String(email).toLowerCase()));
  }

  isValidFile(file: string): boolean {
    const re = /(\.jpg|\.bmp|\.gif|\.png)$/i;
    return re.test(String(file).toLowerCase());
  }
  submit(): void {
    let message: string;
    // Validate current stage
    // TODO: Check if there is an email validator
    if (!this.isValidEmail(this.seedConfig.contactDetails.contactEmail, false)) {
      message = "Please enter a value for Contact Email";
    } else if (!this.seedConfig.contactDetails.remarks) {
      message = "Please enter a value for Additional Remarks";
    } else if (!Utils.isValidUrl(this.seedConfig.contactDetails.logo)
                || !this.isValidFile(this.seedConfig.contactDetails.logo)) {
      message = "Please enter a valid file type for Project Logo";
    }
    if (message) {
      this.validationError(message);
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
      // Check every stage to make sure they are validated
      this.stageState.forEach((stage: {verified: boolean}, index: number) => {
        if (!stage.verified && index !== 6) {
          message = `Please review stage ${index}`;
        }
      });
      if (message) {
        this.validationError(message);
        return;
      }
      // TODO: Submit schema
    }
  }
}
