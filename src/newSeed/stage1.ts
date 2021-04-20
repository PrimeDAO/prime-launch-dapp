import { RouteConfig } from "aurelia-router";
import { BaseStage } from "./baseStage";
// Let's import the utils helper
import {Utils} from "../services/utils";
export class Stage1 extends BaseStage {
  activate(_params: unknown, routeConfig: RouteConfig): void {
    super.activate(_params, routeConfig);
  }
  // Add a link object to the link object arrays
  addCustomLinks(index: number): void {
    if (index === -1) {
      // Skip check
      // Create a new custom link object
      this.seedConfig.general.customLinks.push({media: undefined, url: undefined});
      return;
    }
    // Create a new custom link object
    this.seedConfig.general.customLinks.push({media: undefined, url: undefined});
  }
  // Delet a row in the custom links array
  deleteCustomLinks(index:number): void {
    // Remove the indexed link
    this.seedConfig.general.customLinks.splice(index, 1);
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
    else if (this.seedConfig.general.customLinks.length > 0 && (!this.seedConfig.general.customLinks[this.seedConfig.general.customLinks.length - 1]?.media || !this.seedConfig.general.customLinks[this.seedConfig.general.customLinks.length - 1].url )) {
      message = "Please enter a value for the Custom Link";
    }
    // Validate the link
    this.seedConfig.general.customLinks.forEach((link: {media:string, url:string}) => {
      if (!link.media) {
        // Current input as not been filled out
        message = "Please enter a value for Custom Link";
        return;
      } else if (!Utils.isValidUrl(link.url, false)) {
        // Current input as not been filled out
        message = `Please enter a valid url for ${link.media}`;
        return;
      }
    });
    if (message) {
      this.validationError(message);
    } else {
      // For stage 1 write a verified true to stage 1
      this.stageState[this.stageNumber].verified = true;
      this.next();
    }
  }
}
