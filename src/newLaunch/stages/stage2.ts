import { ILaunchConfig } from "../launchConfig";
import { BaseStage } from "newLaunch/baseStage";

export class Stage2 extends BaseStage<ILaunchConfig> {

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.launchConfig.projectDetails.summary) {
      message = "Please enter a value for Short Description";
    } else if (!this.launchConfig.projectDetails.proposition) {
      message = "Please enter a value for Value Proposition";
    } else if (!this.launchConfig.projectDetails.teamDescription) {
      message = "Please enter a value for Team Description";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
