import { BaseStage } from "newLbp/baseStage";

export class Stage2 extends BaseStage {

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.lbpConfig.projectDetails.summary) {
      message = "Please enter a value for Short Description";
    } else if (!this.lbpConfig.projectDetails.proposition) {
      message = "Please enter a value for Value Proposition";
    } else if (!this.lbpConfig.projectDetails.teamDescription) {
      message = "Please enter a value for Team Description";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
