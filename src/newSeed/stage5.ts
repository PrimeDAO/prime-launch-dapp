import { BaseStage } from "newSeed/baseStage";
import { Utils } from "services/utils";

export class Stage5 extends BaseStage {

  async proceed(): Promise<void> {
    let message = await this.validateInputs();
    if (message) {
      this.validationError(message);
      this.stageState.verified = false;
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
    if (!Utils.isValidEmail(this.seedConfig.contactDetails.contactEmail)) {
      message = "Please enter a valid email address for Contact Email";
    }
    return message;
  }
}
