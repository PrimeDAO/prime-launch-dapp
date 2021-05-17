import { BaseStage } from "newSeed/baseStage";

export class Stage2 extends BaseStage {
  proceed(): void {
    const message: string = this.validateInputs();
    if (message) {
      this.validationError(message);
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
      this.next();
    }
  }

  detached(): void {
    const message = this.validateInputs();
    if (message) {
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
    }
  }

  validateInputs(): string {
    let message: string;
    if (!this.seedConfig.projectDetails.summary) {
      message = "Please enter a value for Project Summary";
    } else if (!this.seedConfig.projectDetails.proposition) {
      message = "Please enter a value for Value Proposition";
    } else if (!this.seedConfig.projectDetails.category) {
      message = "Please enter a value for Project Category";
    }
    return message;
  }
}
