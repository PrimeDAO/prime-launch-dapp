import { BaseStage } from "newSeed/baseStage";
import { Utils } from "services/utils";

export class Stage2 extends BaseStage {

  private isValidImageFormat(file: string): boolean {
    const re = /(\.jpg|\.bmp|\.gif|\.png)$/i;
    return re.test(String(file).toLowerCase());
  }

  seedLogoIsValid = false;
  seedLogoIsLoaded = false;
  private isValidSeedLogo(): string {
    let message;

    if (!Utils.isValidUrl(encodeURI(this.seedConfig.projectDetails.logo))) {
      message = "Please enter a valid URL for Project Logo";
    } else if (!this.isValidImageFormat(this.seedConfig.projectDetails.logo)) {
      message = "Please supply a valid image file type for Project Logo";
    }
    this.seedLogoIsValid = !message;
    if (!this.seedLogoIsValid) {
      this.seedLogoIsLoaded = false;
    }
    return message;
  }

  private isLoadedSeedLogo(valid: boolean): void {
    if (this.seedLogoIsValid) {
      this.seedLogoIsLoaded = valid;
    }
  }

  validateInputs(): Promise<string> {
    let message: string;
    if (!this.seedConfig.projectDetails.summary) {
      message = "Please enter a value for Short Description";
    } else if (!this.seedConfig.projectDetails.proposition) {
      message = "Please enter a value for Value Proposition";
    } else if (!this.seedConfig.projectDetails.teamDescription) {
      message = "Please enter a value for Team Description";
    } else if (!Utils.isValidUrl(encodeURI(this.seedConfig.projectDetails.logo))) {
      message = "Please enter a valid URL for Project Logo";
    } else if (!this.isValidImageFormat(this.seedConfig.projectDetails.logo)) {
      message = "Please supply a valid image file type for Project Logo";
    } else if (!this.seedLogoIsLoaded) {
      message = "No valid image found at the provided Project Logo URL";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
