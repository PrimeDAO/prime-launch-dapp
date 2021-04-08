import { BaseStage } from "./baseStage";

export class Stage1 extends BaseStage {
  proceed(): void {
    let message: string;

    if (!this.seedConfig?.general?.projectName) {
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
