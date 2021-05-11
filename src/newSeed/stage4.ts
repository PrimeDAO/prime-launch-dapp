import { BaseStage } from "newSeed/baseStage";
import Litepicker from "litepicker";

export class Stage4 extends BaseStage {
  protected startDateRef: HTMLElement | HTMLInputElement;
  protected endDateRef: HTMLElement | HTMLInputElement;
  protected startDate: { date: string, time: string };
  protected endDate: { date: string, time: string };

  attached(): void {
    if (!this.startDate) {
      this.startDate = { date: undefined, time: undefined };
      this.endDate = { date: undefined, time: undefined };
    }
    const startDatePicker = new Litepicker({
      element: this.startDateRef,
      minDate: Date.now(),
    });
    // const dateService = new DateService();
    startDatePicker.on("selected", (date: Date) => {
      this.startDate.date = new Date(date.toDateString()).toLocaleDateString().replace(/\//g, "-");
      // this.seedConfig.seedDetails.startDate.date = new Date(date.toDateString()).toUTCString();
    });
    const endDatePicker = new Litepicker({
      element: this.endDateRef,
      minDate: Date.now(),
    });
    endDatePicker.on("selected", (date: Date) => {
      this.endDate.date = new Date(date.toDateString()).toLocaleDateString().replace(/\//g, "-");
      // this.seedConfig.seedDetails.endDate.date = dateService.toISOString(date);
    });
  }
  proceed(): void {
    let message: string;
    if (!this.seedConfig.seedDetails.seedTokens || this.seedConfig.seedDetails.seedTokens === "0") {
      message = "Please enter a value for the Amount of tokens to be added to SEED";
    } else if (!this.seedConfig.seedDetails.pricePerToken || this.seedConfig.seedDetails.pricePerToken === "0") {
      message = "Please enter a value for the Price per token";
    } else if (!this.seedConfig.seedDetails.seedTarget || this.seedConfig.seedDetails.seedTarget === "0") {
      message = "Please enter a non-zero value for the SEED Target";
    } else if (!this.seedConfig.seedDetails.seedMax || this.seedConfig.seedDetails.seedMax === "0") {
      message = "Please enter a non-zero number for the SEED Max";
    } else if (!this.seedConfig.seedDetails.vestingDays || this.seedConfig.seedDetails.vestingDays <= 0) {
      message = "Please enter a non-zero value for  \"Tokens vested for\" ";
    } else if (!this.seedConfig.seedDetails.vestingCliff || this.seedConfig.seedDetails.vestingCliff <= 0) {
      message = "Please enter a non-zero value for \"with a cliff of\" ";
    } else if (!this.startDate.date) {
      message = "Please select a Start Date";
    } else if (!this.startDate.time) {
      message = "Please enter a value for the Start Time";
    } else if (!this.endDate.date) {
      message = "Please select an End Date";
    } else if (!this.endDate.time) {
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
      // Set the ISO time
      this.seedConfig.seedDetails.startDate = this.startDate.date + "T" + this.startDate.time + "Z";
      this.seedConfig.seedDetails.endDate = this.endDate.date + "T" + this.endDate.time + "Z";
      this.stageState[this.stageNumber].verified = true;
      this.next();
    }
  }
}
