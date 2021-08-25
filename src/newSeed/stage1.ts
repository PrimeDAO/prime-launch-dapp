import { BaseStage } from "./baseStage";
// Let's import the utils helper
import { Utils } from "../services/utils";
import { SocialLinkNames, SocialLinkSpec } from "newSeed/seedConfig";

// interface ISocialLinkInfo {
//   platformIndex: number,
//   url: string,
// }

export class Stage1 extends BaseStage {

  public socialLinkNames = SocialLinkNames;

  public setMediaFromIndex(index: number, link: SocialLinkSpec): void {
    link.media = SocialLinkNames[index];
  }

  public getMediaIndexForLink(link: SocialLinkSpec): number {
    return SocialLinkNames.indexOf(link.media);
  }

  // Add a link object to the link object arrays
  addCustomLink(): void {
    // Create a new custom link object
    this.seedConfig.general.customLinks.push(new SocialLinkSpec());
  }
  // Delet a row in the custom links array
  deleteCustomLinks(index:number): void {
    // Remove the indexed link
    this.seedConfig.general.customLinks.splice(index, 1);
  }

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.seedConfig.general.projectName) {
      message = "Please enter a value for Project Name";
    }
    else if (!Utils.isValidUrl(this.seedConfig.general.projectWebsite)) {
      message = "Please enter a valid URL for Project Website";
    }
    else if (!this.seedConfig.general.category) {
      message = "Please enter a Category";
    } else if (!Utils.isValidUrl(this.seedConfig.general.whitepaper)) {
      message = "Please enter a valid URL for Whitepaper";
    } else if (!Utils.isValidUrl(this.seedConfig.general.github)) {
      message = "Please enter a valid URL for Github Link";
    }
    // Validate the link
    for (const link of this.seedConfig.general.customLinks ){
      if (!link.media) {
        // Current input as not been filled out
        message = "Please select a social media platform";
      } else if (!Utils.isValidUrl(link.url, false)) {
        // Current input as not been filled out
        message = `Please enter a valid URL for ${link.media}`;
      }
      if (message) {
        break;
      }
    }
    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
