import { ILaunchConfig } from "../launchConfig";
import { BaseStage } from "newLaunch/baseStage";
import { Utils } from "services/utils";

export class Stage5 extends BaseStage<ILaunchConfig> {

  async proceed(): Promise<boolean> {
    if (await super.proceed(false)) {
    /**
     * Since this is the last stage and we are apparently valid,
     * then we have to confirm the other stages before moving on.
     */
      for (let i = 1; i < this.stageNumber; ++i) {
        if (!this.stageStates[i].verified) {
          this.validationError(`Please review step ${i} - ${this.stageStates[i].title}`);
          return;
        }
      }
      // apparently all are valid, so proceed
      this.next();
    } // else we are not valid. Don't proceed.
  }

  validateInputs(): Promise<string> {
    let message: string;
    // Validate current stage
    // TODO: Check if there is an email validator
    if (!Utils.isValidEmail(this.launchConfig.contactDetails.contactEmail)) {
      message = "Please enter a valid email address for Contact Email";
    }
    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
