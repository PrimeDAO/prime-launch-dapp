import { BaseStage } from "newLaunch/baseStage";
import { Utils } from "../../services/utils";
import { CategoryNames, SocialLinkNames, SocialLinkSpec } from "newLaunch/lbp/lbpConfig";

export class Stage1 extends BaseStage {

  public socialLinkNames = SocialLinkNames;
  public categoryNames = CategoryNames;

  public setCategoryName(name: string, _index: number): void {
    this.lbpConfig.general.category = name;
  }

  public getCategoryNameIndex(): number {
    return this.lbpConfig.general.category ? CategoryNames.indexOf(this.lbpConfig.general.category) : undefined;
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
    this.lbpConfig.general.customLinks.push(new SocialLinkSpec());
  }
  // Delet a row in the custom links array
  deleteCustomLinks(index:number): void {
    // Remove the indexed link
    this.lbpConfig.general.customLinks.splice(index, 1);
  }

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.lbpConfig.general.projectName) {
      message = "Please enter a value for Project Name";
    }
    else if (!Utils.isValidUrl(this.lbpConfig.general.projectWebsite)) {
      message = "Please enter a valid URL for Project Website";
    }
    else if (!this.lbpConfig.general.category) {
      message = "Please select a Category";
    } else if (!Utils.isValidUrl(this.lbpConfig.general.whitepaper)) {
      message = "Please enter a valid URL for Whitepaper";
    } else if (!Utils.isValidUrl(this.lbpConfig.general.github)) {
      message = "Please enter a valid URL for Github Link";
    }
    // Validate the link
    for (const link of this.lbpConfig.general.customLinks ){
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
