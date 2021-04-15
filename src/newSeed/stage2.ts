import { BaseStage } from "newSeed/baseStage";

export class Stage2 extends BaseStage {
    proceed(): void {
        let message: string;
    
        if (!this.seedConfig?.projectDetails?.summary) {
          message = "Please fill the summary of the project";
        } else if (!this.seedConfig?.projectDetails?.proposition) {
            message = "Please fill the value proposition";
        } else if (!this.seedConfig?.projectDetails?.category) {
            message = "Please fill the category of the project";
        }
        if (message) {
          this.validationError(message);
        } else {
          this.next();
        }
      }
}
