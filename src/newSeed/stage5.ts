import { BaseStage } from "newSeed/baseStage";

export class Stage5 extends BaseStage {
  submit(): void {
    let message: string;
    // Validate current stage
    // TODO: Check if there is an email validator
    if (!this.seedConfig.contactDetails.contactEmail) {
      message = "Please enter a value for Contact Email";
    } else if (!this.seedConfig.contactDetails.remarks) {
      message = "Please enter a value for Additional Remarks";
    }
    // Check every stage to make sure they are validated
    this.stageState.forEach((stage: {verified: boolean}) => {

    });
    if (message) {
      this.validationError(message);
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
      // TODO: Submit schema
    }
  }
}
