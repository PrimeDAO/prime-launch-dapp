import { BaseStage } from "newSeed/baseStage";

export class Stage2 extends BaseStage {
  proceed(): void {
    let message: string;

    if (!this.seedConfig?.projectDetails?.summary) {
      message = "Enter a value for Project Name";
    }
    // else if (!this.seedConfig?.general?.whatever) {
    //   message = "Enter a value for whatever";
    // }

    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }
}
