import { RouteConfig } from "aurelia-router";
import { BaseStage } from "./baseStage";
// Let's import the utils helper
import {Utils} from "../services/utils";
export class Stage1 extends BaseStage {
  activate(_params: unknown, routeConfig: RouteConfig): void {
    super.activate(_params, routeConfig);
    // Add one object to the array if empty
    if (this.seedConfig.general.customLinks.length < 1) {
      this.seedConfig.general.customLinks.push({media: undefined, url: undefined});
    }
  }
  // Add a link object to the link object arrays
  addCustomLinks(index: number): void {
    // Only add after filling the previous
    if (!this.seedConfig.general.customLinks[index]["media"]) {
      // Current input as not been filled out
      this.validationError("Please enter a value for Custom Link");
      return;
    } else if (!Utils.isValidUrl(this.seedConfig.general.customLinks[index]["url"], false)) {
      // Current input as not been filled out
      this.validationError("Please enter a valid url for URL");
      return;
    }
    // Create a new custom link object
    this.seedConfig.general.customLinks.push({media: undefined, url: undefined});
  }
  proceed(): void {
    let message: string;
    if (!this.seedConfig.general.projectName) {
      message = "Please enter a value for Project Name";
    }
    else if (!Utils.isValidUrl(this.seedConfig.general.projectWebsite, false)) {
      message = "Please enter a valid url for Project Website";
    }
    else if (!this.seedConfig.general.category) {
      message = "Please enter a Category";
    } else if (!Utils.isValidUrl(this.seedConfig.general.whitepaper, false)) {
      message = "Please enter a valid url for Whitepaper";
    } else if (!Utils.isValidUrl(this.seedConfig.general.github, false)) {
      message = "Please enter a valid url for Github Link";
    }
    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }
}
