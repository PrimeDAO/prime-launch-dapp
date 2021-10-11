import { ILaunchConfig } from "../launchConfig";
import { BaseStage } from "../baseStage";
import { Utils } from "../../services/utils";
import { CategoryNames, SocialLinkNames, SocialLinkSpec } from "newLaunch/launchConfig";

export class Stage1 extends BaseStage<ILaunchConfig> {

  public socialLinkNames = SocialLinkNames;
  public categoryNames = CategoryNames;

  public setCategoryName(name: string, _index: number): void {
    this.launchConfig.general.category = name;
  }

  public getCategoryNameIndex(): number {
    return this.launchConfig.general.category ? CategoryNames.indexOf(this.launchConfig.general.category) : undefined;
  }

  public setMediaFromIndex(name: string, _index: number, link: SocialLinkSpec): void {
    link.media = name;
  }

  public getMediaIndexForLink(link: SocialLinkSpec): number {
    return link.media ? SocialLinkNames.indexOf(link.media) : undefined;
  }

  // Add a link object to the link object arrays
  addCustomLink(): void {
    // Create a new custom link object
    this.launchConfig.general.customLinks.push(new SocialLinkSpec());
  }
  // Delet a row in the custom links array
  deleteCustomLinks(index:number): void {
    // Remove the indexed link
    this.launchConfig.general.customLinks.splice(index, 1);
  }

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.launchConfig.general.projectName) {
      message = "Please enter a value for Project Name";
    }
    else if (!Utils.isValidUrl(this.launchConfig.general.projectWebsite)) {
      message = "Please enter a valid URL for Project Website";
    }
    else if (!this.launchConfig.general.category) {
      message = "Please select a Category";
    } else if (!Utils.isValidUrl(this.launchConfig.general.whitepaper)) {
      message = "Please enter a valid URL for Whitepaper";
    } else if (!Utils.isValidUrl(this.launchConfig.general.github)) {
      message = "Please enter a valid URL for Github Link";
    }
    // Validate the link
    for (const link of this.launchConfig.general.customLinks ){
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
