import { WhiteListService } from "services/WhiteListService";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { DateService } from "services/DateService";
import { BaseStage } from "newLbp/baseStage";
import Litepicker from "litepicker";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { NumberService } from "services/NumberService";
import { DisclaimerService } from "services/DisclaimerService";
// import { BigNumber } from "ethers";
import { Address, EthereumService, fromWei } from "services/EthereumService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage4 extends BaseStage {
  startDateRef: HTMLElement | HTMLInputElement;
  endDateRef: HTMLElement | HTMLInputElement;
  startDate: Date;
  startTime = ""
  endDate: Date;
  endTime = "";
  dateService = new DateService();
  startDatePicker: Litepicker;
  endDatePicker: Litepicker;
  lastCheckedFundingAddress: string;
  fundingSymbol: string;
  fundingIcon: string;
  whitelist: Set<Address>;
  loadingWhitelist = false;
  lastWhitelistUrlValidated: string;
  // totally faked ATM.  Don't keep any of this code.
  tokenList=
  (process.env.NETWORK === "mainnet") ?
    [
      "0xE59064a8185Ed1Fca1D17999621eFedfab4425c9",
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    ] : // rinkeby of course
    [
      "0x80E1B5fF7dAdf3FeE78F60D69eF1058FD979ca64",
      "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
    ];

  sliderStartWeights: HTMLInputElement;
  sliderEndWeights: HTMLInputElement;

  constructor(
    eventAggregator: EventAggregator,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    router: Router,
    tokenService: TokenService,
    private whiteListService: WhiteListService,
    private disclaimerService: DisclaimerService,
  ) {
    super(router, eventAggregator, tokenService);
    this.eventAggregator.subscribe("lbp.clearState", () => {
      this.startDate = undefined;
      this.endDate = undefined;
      this.startTime = undefined;
      this.endTime = undefined;
    });
  }

  attached(): void {
    this.startDatePicker = new Litepicker({
      element: this.startDateRef,
      minDate: Date.now(),
    });

    this.startDatePicker.on("selected", (date: { toJSDate(): Date }) => {
      this.startDate = date.toJSDate();
    });

    this.endDatePicker = new Litepicker({
      element: this.endDateRef,
      minDate: Date.now(),
    });

    this.endDatePicker.on("selected", (date: { toJSDate(): Date }) => {
      this.endDate = date.toJSDate();
    });

    this.sliderStartWeights.oninput = (event: Event) => {
      this.lbpConfig.lbpDetails.startWeight = Number.parseFloat((event.target as HTMLInputElement).value);
      // Move the end weight to the same value as the start weight
      // if its greater than the start weight.
      if (this.lbpConfig.lbpDetails.startWeight < this.lbpConfig.lbpDetails.endWeight) {
        this.lbpConfig.lbpDetails.endWeight = this.lbpConfig.lbpDetails.startWeight;
      }
    };

    this.sliderEndWeights.oninput = (event: Event) => {
      let endWeight = Number.parseFloat((event.target as HTMLInputElement).value);
      if (endWeight > this.lbpConfig.lbpDetails.startWeight) {
        endWeight = this.lbpConfig.lbpDetails.startWeight;
        (event.target as HTMLInputElement).value = endWeight.toString();
      }
      this.lbpConfig.lbpDetails.endWeight = endWeight;
    };
  }

  setLbpConfigStartDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const startTimes = this.startTime.split(":");
    const temp = this.startDate;
    temp.setHours(Number.parseInt(startTimes[0]), Number.parseInt(startTimes[1]));
    this.lbpConfig.lbpDetails.startDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.lbpConfig.lbpDetails.startDate);
  }

  setLbpConfigEndDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const endTimes = this.endTime.split(":");
    const temp = this.endDate;
    temp.setHours(Number.parseInt(endTimes[0]), Number.parseInt(endTimes[1]));
    this.lbpConfig.lbpDetails.endDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.lbpConfig.lbpDetails.endDate);
  }

  // persistData(): void {
  //   this.setLbpConfigStartDate();
  //   this.setLbpConfigEndDate();
  //   this.wizardState.lbpStartDate = this.lbpConfig.lbpDetails.startDate;
  // }

  toggleLegalDisclaimer(): void {
    this.lbpConfig.lbpDetails.legalDisclaimer = !this.lbpConfig.lbpDetails.legalDisclaimer;
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
    if (!Utils.isAddress(this.lbpConfig.tokenDetails.projectTokenAddress)) {
      message = "Please select a Project Token";
    } else if (!(parseFloat(this.lbpConfig.lbpDetails.amountProjectToken) >= 0)) {
      message = `Please enter the amount of ${this.wizardState.projectTokenInfo.name}, you like to provide for launch`;
    } else if (this.numberService.fromString(this.lbpConfig.lbpDetails.amountProjectToken) >= this.numberService.fromString(this.lbpConfig.tokenDetails.maxProjectTokenSupply)) {
      message = `"Project token amount" should not exceed the maximum supply of ${fromWei(this.lbpConfig.tokenDetails.maxProjectTokenSupply)} tokens`;
    } else if (!Utils.isAddress(this.lbpConfig.lbpDetails.fundingTokenAddress)) {
      message = "Please select a Funding Token";
    } else if (!(parseFloat(this.lbpConfig.lbpDetails.amountFundingToken) >= 0)) {
      message = `Please enter the amount of ${this.wizardState.fundingTokenInfo.name}, you like to provide for launch`;
    } else if (!this.startDate) {
      message = "Please select a Start Date";
    } else if (!this.startTime) {
      message = "Please enter a value for the Start Time";
    } else if (!re.test(startTimes[0]) || !re.test(startTimes[1]) || startTimes.length > 2) {
      message = "Please enter a valid value for Start Time";
    } else if (!(Number.parseInt(startTimes[0]) >= 0)
      || !(Number.parseInt(startTimes[0]) < 24)) {
      message = "Please enter a valid value for Start Time";
    } else if (!(Number.parseInt(startTimes[1]) >= 0)
      || !(Number.parseInt(startTimes[1]) < 60)) {
      message = "Please enter a valid value for Start Time";
    } else if (!this.endDate) {
      message = "Please select an End Date";
    } else if (!this.endTime) {
      message = "Please enter a value for the End Time";
    } else if (!re.test(endTimes[0]) || !re.test(endTimes[1]) || endTimes.length > 2) {
      message = "Please enter a valid value for End Time";
    } else if (!(Number.parseInt(endTimes[0]) >= 0)
      || !(Number.parseInt(endTimes[0]) < 24)) {
      message = "Please enter a valid value for End Time";
    } else if (!(Number.parseInt(endTimes[1]) >= 0)
      || !(Number.parseInt(endTimes[1]) < 60)) {
      message = "Please enter a valid value for End Time";
    } else if (this.lbpConfig.lbpDetails.endWeight > this.lbpConfig.lbpDetails.startWeight) {
      message = `The ${this.wizardState.fundingTokenInfo.symbol} end-weight should be higher then the start-weight`;
    } else if (this.setLbpConfigEndDate() <= this.setLbpConfigStartDate()) {
      message = "Please select an End Date greater than the Start Date";
    } else if (this.setLbpConfigEndDate().getTime() >= this.setLbpConfigStartDate().getTime() + 30 * 24 * 60 * 60 * 1000) {
      message = "Launch duration can not exceed 30 days";
    } else if (!this.lbpConfig.lbpDetails.legalDisclaimer) {
      message = "Please confirm the Legal Disclaimer";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }

}
