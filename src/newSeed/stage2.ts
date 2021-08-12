import { BaseStage } from "newSeed/baseStage";

export class Stage2 extends BaseStage {

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.seedConfig.projectDetails.summary) {
      message = "Please enter a value for Short Description";
    } else if (!this.seedConfig.projectDetails.proposition) {
      message = "Please enter a value for Value Proposition";
    } else if (!this.seedConfig.projectDetails.teamDescription) {
      message = "Please enter a value for Team Description";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
