import { DateService } from "./../services/DateService";
import { BaseStage } from "newSeed/baseStage";
import Litepicker from "litepicker";

export class Stage4 extends BaseStage {
  protected startDateRef: HTMLElement | HTMLInputElement;
  protected endDateRef: HTMLElement | HTMLInputElement;
  protected startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  dateService = new DateService();
  startDatePicker: Litepicker;
  endDatePicker: Litepicker;

  attached(): void {
    if (!this.startDatePicker) {
      this.startDatePicker = new Litepicker({
        element: this.startDateRef,
        minDate: Date.now(),
        autoRefresh: true,
      });
      this.startDatePicker.on("selected", (date: Date) => {
        this.startDate = date;
      });
    }
    if (!this.endDatePicker) {
      this.endDatePicker = new Litepicker({
        element: this.endDateRef,
        minDate: Date.now(),
        autoRefresh: true,
      });
      this.endDatePicker.on("selected", (date: Date) => {
        this.endDate = date;
      });
    }
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
    } else if (!this.startDate) {
      message = "Please select a Start Date";
    } else if (!this.startTime) {
      message = "Please enter a value for the Start Time";
    } else if (!this.endDate) {
      message = "Please select an End Date";
    } else if (!this.endTime) {
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
      // Get the start and end time
      const startTimes = this.startTime.split(":");
      const endTimes = this.endTime.split(":");
      this.startDate.setHours(Number.parseInt(startTimes[0]), Number.parseInt(startTimes[1]));
      this.seedConfig.seedDetails.startDate = this.dateService.toISOString(this.startDate);
      this.endDate.setHours(Number.parseInt(endTimes[0]), Number.parseInt(endTimes[1]));
      this.seedConfig.seedDetails.endDate = this.dateService.toISOString(this.endDate);
      console.log(this.seedConfig.seedDetails.endDate);
      this.stageState[this.stageNumber].verified = true;
      this.next();
    }
  }
}
