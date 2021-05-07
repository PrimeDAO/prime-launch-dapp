import { BaseStage } from "newSeed/baseStage";
import Litepicker from "litepicker";

export class Stage4 extends BaseStage {
  protected startDate: HTMLElement | HTMLInputElement;
  protected endDate: HTMLElement | HTMLInputElement;
  attached(): void {
    const startDatePicker = new Litepicker({
      element: this.startDate,
      minDate: Date.now(),
    });
    startDatePicker.on("selected", (date1: Date) => {
      this.seedConfig.seedDetails.startDate = new Date(date1.toDateString()).toLocaleDateString().replace(/\//g, "-");
    });
    const endDatePicker = new Litepicker({
      element: this.endDate,
      minDate: Date.now(),
    });
    endDatePicker.on("selected", (date1: Date) => {
      this.seedConfig.seedDetails.endDate = new Date(date1.toDateString()).toLocaleDateString().replace(/\//g, "-");
    });
  }
  proceed(): void {
    let message: string;
    if (!this.seedConfig.seedDetails.seedTokens || this.seedConfig.seedDetails.seedTokens.lte(0)) {
      message = "Please enter a value for the Amount of tokens to be added to SEED";
    } else if (!this.seedConfig.seedDetails.pricePerToken || this.seedConfig.seedDetails.pricePerToken.lte(0)) {
      message = "Please enter a value for the Price per token";
    } else if (!this.seedConfig.seedDetails.seedTarget || this.seedConfig.seedDetails.seedTarget.lte(0)) {
      message = "Please enter a non-zero value for the SEED Target";
    } else if (!this.seedConfig.seedDetails.seedMax || this.seedConfig.seedDetails.seedMax.lte(0)) {
      message = "Please enter a non-zero number for the SEED Max";
    } else if (!this.seedConfig.seedDetails.vestingDays || this.seedConfig.seedDetails.vestingDays <= 0) {
      message = "Please enter a non-zero value for  \"Tokens vested for\" ";
    } else if (!this.seedConfig.seedDetails.vestingCliff || this.seedConfig.seedDetails.vestingCliff <= 0) {
      message = "Please enter a non-zero value for \"with a cliff of\" ";
    } else if (!this.seedConfig.seedDetails.startDate) {
      message = "Please select a Start Date";
    } else if (!this.seedConfig.seedDetails.startTime) {
      message = "Please enter a value for the Start Time";
    } else if (!this.seedConfig.seedDetails.endDate) {
      message = "Please select an End Date";
    } else if (!this.seedConfig.seedDetails.endTime) {
      message = "Please enter a value for the End Time";
    } else if (this.seedConfig.seedDetails.whitelist.isWhitelist && !this.seedConfig.seedDetails.whitelist.whitelistFile) {
      message = "Please upload a .csv file or uncheck Whitelist";
    } else if (!this.seedConfig.seedDetails.legalDisclaimer) {
      message = "Please accept the Legal Disclaimer";
    }
    if (message) {
      this.validationError(message);
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
      this.next();
    }
  }
}
