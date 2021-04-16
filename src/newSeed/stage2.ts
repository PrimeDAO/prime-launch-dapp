import { RouteConfig } from "aurelia-router";
import { BaseStage } from "newSeed/baseStage";

export class Stage2 extends BaseStage {
  activate(params: unknown, routeConfig:RouteConfig): void {
    super.activate(params, routeConfig);
    // Initialise category with an empty string
    if (!this.seedConfig.projectDetails.category) {
      this.seedConfig.projectDetails.category = "";
    }
    if (!this.seedConfig.projectDetails.summary) {
      this.seedConfig.projectDetails.summary = "";
    }
    if (!this.seedConfig.projectDetails.proposition) {
      this.seedConfig.projectDetails.proposition = "";
    }
  }
  proceed(): void {
    let message: string;
    if (!this.seedConfig.projectDetails.summary) {
      message = "Please enter a value for Project Summary";
    } else if (!this.seedConfig.projectDetails.proposition) {
      message = "Please enter a value for Value Proposition";
    } else if (!this.seedConfig.projectDetails.category) {
      message = "Please enter a value for Project Category";
    }
    if (message) {
      this.validationError(message);
    } else {
      // For stage 1 write a verified true to stage 1
      this.stageState[1].verified = true;
      console.log(this.stageState);
      this.next();
    }
  }
}
