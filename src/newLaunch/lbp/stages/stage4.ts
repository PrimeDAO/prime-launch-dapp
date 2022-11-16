import { LaunchService } from "services/LaunchService";
import { AureliaHelperService } from "services/AureliaHelperService";
import { WhiteListService } from "services/WhiteListService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import { DateService } from "services/DateService";
import { BaseStage } from "newLaunch/baseStage";
import Litepicker from "litepicker";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { NumberService } from "services/NumberService";
import { DisclaimerService } from "services/DisclaimerService";
import { Address, EthereumService, fromWei } from "services/EthereumService";
import { ITokenInfo, TokenService } from "services/TokenService";
import { TokenListService } from "services/TokenListService";
import { ILbpConfig } from "newLaunch/lbp/config";

import { LbpProjectTokenPriceService } from "services/LbpProjectTokenPriceService";
import { ILaunchPreviewConfig } from "newLaunch/lbp/elements/launch-preview/launch-preview";

@singleton(false)
@autoinject
export class Stage4 extends BaseStage<ILbpConfig> {
  launchConfig: ILbpConfig;
  startDateRef: HTMLElement | HTMLInputElement;
  endDateRef: HTMLElement | HTMLInputElement;
  startDate: Date;
  startTime = "00:00"
  endDate: Date;
  endTime = "00:00";
  dateService = new DateService();
  startDatePicker: Litepicker;
  endDatePicker: Litepicker;
  lastCheckedFundingAddress: string;
  fundingSymbol: string;
  fundingIcon: string;
  whitelist: Set<Address>;
  loadingWhitelist = false;
  lastWhitelistUrlValidated: string;
  tokenList: Array<ITokenInfo>;

  sliderStartWeights: HTMLInputElement;
  sliderEndWeights: HTMLInputElement;
  projectTokenObserved = false;

  launchPreviewConfig: ILaunchPreviewConfig;

  launchDuration = -1;

  constructor(
    eventAggregator: EventAggregator,
    private numberService: NumberService,
    ethereumService: EthereumService,
    router: Router,
    tokenService: TokenService,
    private tokenListService: TokenListService,
    private whiteListService: WhiteListService,
    private disclaimerService: DisclaimerService,
    private aureliaHelperService: AureliaHelperService,
    private launchService: LaunchService,
    private lbpProjectTokenPriceService: LbpProjectTokenPriceService,
  ) {
    super(router, ethereumService, eventAggregator, tokenService);
    this.eventAggregator.subscribe("launch.clearState", () => {
      this.startDate = undefined;
      this.endDate = undefined;
      this.startTime = undefined;
      this.endTime = undefined;
    });
  }

  async attached(): Promise<void> {
    if (!this.projectTokenObserved) {
      this.aureliaHelperService.createPropertyWatch(this.launchConfig.tokenDetails, "projectTokenInfo",
        () => {
          this.launchConfig.launchDetails.amountProjectToken = "";
        });

      this.projectTokenObserved = true;
    }

    this.startDatePicker = new Litepicker({
      element: this.startDateRef,
      minDate: Date.now(),
    });

    this.startDatePicker.on("selected", (date: { toJSDate(): Date }) => {
      this.startDate = date.toJSDate();
      this.setLaunchDuration();
    });

    this.endDatePicker = new Litepicker({
      element: this.endDateRef,
      minDate: Date.now(),
    });

    this.endDatePicker.on("selected", (date: { toJSDate(): Date }) => {
      this.endDate = date.toJSDate();
      this.setLaunchDuration();
    });

    if (!this.tokenList) {
      this.tokenList = await this.launchService.fetchFundingTokenInfos();
    }
  }

  tokenChanged(): void {
    this.launchConfig.launchDetails.amountFundingToken = "";
  }

  toggleGeoBlocking(): void {
    this.launchConfig.launchDetails.geoBlock = !this.launchConfig.launchDetails.geoBlock;
  }

  handleStartWeightChange(event: Event): void {
    // Move the end weight to the same value as the start weight
    // if its greater than the start weight.
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);

    if (value < this.launchConfig.launchDetails.endWeight) {
      this.launchConfig.launchDetails.endWeight = value;
    }
    this.launchConfig.launchDetails.startWeight = value;
  }

  handleEndWeightChange(event: Event): void {
    // Controls that the end weight is always less then or equal
    // to the start weight
    const target = event.target as HTMLInputElement;

    if (parseInt(target.value) > this.launchConfig.launchDetails.startWeight) {
      target.value = this.launchConfig.launchDetails.startWeight.toString();
    }
    this.launchConfig.launchDetails.endWeight = parseInt(target.value);
  }

  setLaunchConfigStartDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const startTimes = this.startTime.split(":");
    const temp = this.startDate;
    temp.setHours(Number.parseInt(startTimes[0]), Number.parseInt(startTimes[1]));
    this.launchConfig.launchDetails.startDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.launchConfig.launchDetails.startDate);
  }

  setLaunchConfigEndDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const endTimes = this.endTime.split(":");
    const temp = this.endDate;
    temp.setHours(Number.parseInt(endTimes[0]), Number.parseInt(endTimes[1]));
    this.launchConfig.launchDetails.endDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.launchConfig.launchDetails.endDate);
  }

  persistData(): void {
    this.setLaunchConfigStartDate();
    this.setLaunchConfigEndDate();
    // Save the admin address to wizard state in order to persist it after launchConfig state is cleared in stage7
    this.wizardState.launchAdminAddress = this.launchConfig.launchDetails.adminAddress;
    this.wizardState.launchStartDate = this.launchConfig.launchDetails.startDate;
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  makeMeAdmin() : void {
    this.launchConfig.launchDetails.adminAddress = this.ethereumService.defaultAccountAddress;
  }

  setLaunchDuration(): void {
    if (!this.startDate || !this.endDate || !this.startTime || !this.endTime) return;
    this.launchDuration = (this.setLaunchConfigEndDate().getTime() - this.setLaunchConfigStartDate().getTime()) / 1000 / 60 / 60 / 24 || 0;
  }

  async validateInputs(): Promise<string> {
    let message: string;
    // Split the start and endt time
    let startTimes = [];
    let endTimes = [];
    const re = /^[-+]?(\d+)$/;

    if (this.startTime) {
      startTimes = this.startTime.split(":");
    }
    if (this.endTime) {
      endTimes = this.endTime.split(":");
    }
    if (!Utils.isAddress(this.launchConfig.tokenDetails.projectTokenInfo.address)) {
      message = "Please select a Project Token in Stage 3 - Project Tokens";
    } else if (!(this.numberService.fromString(this.launchConfig.launchDetails.amountProjectToken) >= 0)) {
      message = `Please enter the amount of ${this.launchConfig.tokenDetails.projectTokenInfo.name}, you like to provide for launch`;
    } else if (this.launchConfig.tokenDetails.maxSupply && this.numberService.fromString(this.launchConfig.launchDetails.amountProjectToken) > this.numberService.fromString(this.launchConfig.tokenDetails.maxSupply)) {
      message = `"Project token amount" should not exceed the maximum supply of ${fromWei(this.launchConfig.tokenDetails.maxSupply, this.launchConfig.tokenDetails.projectTokenInfo.decimals)} tokens`;
    } else if (!Utils.isAddress(this.launchConfig.launchDetails.fundingTokenInfo.address)) {
      message = "Please select a Funding Token lbp";
    } else if (!(this.numberService.fromString(this.launchConfig.launchDetails.amountFundingToken) >= 0)) {
      message = `Please enter the amount of ${this.launchConfig.launchDetails.fundingTokenInfo.name}, you like to provide for launch`;
    } else if (!this.startDate) {
      message = "Please select a Start Date";
    } else if (!this.startTime) {
      message = "Please enter a value for the Start Time (hh:mm in GMT)";
    } else if (!re.test(startTimes[0]) || !re.test(startTimes[1]) || startTimes.length > 2) {
      message = "Please enter a valid value for Start Time (hh:mm in GMT)";
    } else if (!(Number.parseInt(startTimes[0]) >= 0)
      || !(Number.parseInt(startTimes[0]) < 24)) {
      message = "Please enter a valid value for Start Time (hh:mm in GMT)";
    } else if (!(Number.parseInt(startTimes[1]) >= 0)
      || !(Number.parseInt(startTimes[1]) < 60)) {
      message = "Please enter a valid value for Start Time (hh:mm in GMT)";
    } else if (!this.endDate) {
      message = "Please select an End Date";
    } else if (!this.endTime) {
      message = "Please enter a value for the End Time (hh:mm in GMT)";
    } else if (!re.test(endTimes[0]) || !re.test(endTimes[1]) || endTimes.length > 2) {
      message = "Please enter a valid value for End Time (hh:mm in GMT)";
    } else if (!(Number.parseInt(endTimes[0]) >= 0)
      || !(Number.parseInt(endTimes[0]) < 24)) {
      message = "Please enter a valid value for End Time (hh:mm in GMT)";
    } else if (!(Number.parseInt(endTimes[1]) >= 0)
      || !(Number.parseInt(endTimes[1]) < 60)) {
      message = "Please enter a valid value for End Time (hh:mm in GMT)";
    } else if (!Utils.isAddress(this.launchConfig.launchDetails.adminAddress)) {
      message = "Please enter a valid wallet address for the LBP Administrator";
    } else if (this.launchConfig.launchDetails.endWeight > this.launchConfig.launchDetails.startWeight) {
      message = `The ${this.launchConfig.launchDetails.fundingTokenInfo.symbol} end-weight should be higher then the start-weight`;
    } else if (this.setLaunchConfigEndDate() <= this.setLaunchConfigStartDate()) {
      message = "Please select an End Date greater than the Start Date";
    } else if (this.setLaunchConfigEndDate().getTime() > this.setLaunchConfigStartDate().getTime() + 30 * 24 * 60 * 60 * 1000) {
      message = "Launch duration can not exceed 30 days";
    } else if (!Utils.isValidUrl(this.launchConfig.launchDetails.legalDisclaimer, true)) {
      message = "Please enter a valid URL for Legal Disclaimer";
    } else if (this.launchConfig.launchDetails.legalDisclaimer &&
      !await this.disclaimerService.confirmMarkdown(this.launchConfig.launchDetails.legalDisclaimer)) {
      message = "The document at the URL you provided for Legal Disclaimer either does not exist or does not contain valid Markdown";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }
}
