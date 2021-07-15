import { BaseStage } from "newSeed/baseStage";
import { Utils } from "services/utils";

export class Stage5 extends BaseStage {

  async proceed(): Promise<void> {
    let message = await this.validateInputs();
    if (message) {
      this.validationError(message);
    } else {
      // don't need to recheck this stage, since we just did it above
      for (let i = 1; i < this.stageNumber; ++i) {
        if (!this.stageStates[i].verified) {
          message = `Please review step ${i} - ${this.stageStates[i].title}`;
          break;
        }
      }
      if (message) {
        this.nextButtonClicked = true;
        this.validationError(message);
        return;
      }
      this.next();
    }
  }

  validateInputs(): Promise<string> {
    let message: string;
    // Validate current stage
    // TODO: Check if there is an email validator
    if (!Utils.isValidEmail(this.seedConfig.contactDetails.contactEmail)) {
      message = "Please enter a valid email address for Contact Email";
    }
    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
