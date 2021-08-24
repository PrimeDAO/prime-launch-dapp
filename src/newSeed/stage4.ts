import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { DateService } from "./../services/DateService";
import { BaseStage } from "newSeed/baseStage";
import Litepicker from "litepicker";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { NumberService } from "services/NumberService";
import { DisclaimerService } from "services/DisclaimerService";
import { BigNumber } from "ethers";
import { EthereumService, fromWei } from "services/EthereumService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage4 extends BaseStage {
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

  constructor(
    eventAggregator: EventAggregator,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    router: Router,
    tokenService: TokenService,
    private disclaimerService: DisclaimerService,
  ) {
    super(router, eventAggregator, tokenService);
    this.eventAggregator.subscribe("seed.clearState", () => {
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
  }

  toggleGeoBlocking(): void {
    this.seedConfig.seedDetails.geoBlock = !this.seedConfig.seedDetails.geoBlock;
  }

  setSeedConfigStartDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const startTimes = this.startTime.split(":");
    const temp = this.startDate;
    temp.setHours(Number.parseInt(startTimes[0]), Number.parseInt(startTimes[1]));
    this.seedConfig.seedDetails.startDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.seedConfig.seedDetails.startDate);
  }

  setSeedConfigEndDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const endTimes = this.endTime.split(":");
    const temp = this.endDate;
    temp.setHours(Number.parseInt(endTimes[0]), Number.parseInt(endTimes[1]));
    this.seedConfig.seedDetails.endDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.seedConfig.seedDetails.endDate);
  }

  persistData(): void {
    this.setSeedConfigStartDate();
    this.setSeedConfigEndDate();
    // Save the seed admin address to wizard state in order to persist it after seedConfig state is cleared in stage7
    this.wizardState.seedAdminAddress = this.seedConfig.seedDetails.adminAddress;
    this.wizardState.whiteList = this.seedConfig.seedDetails.whitelist;
    this.wizardState.seedStartDate = this.seedConfig.seedDetails.startDate;
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
    if (!Utils.isAddress(this.seedConfig.seedDetails.fundingTokenAddress)) {
      message = "Please select a Funding Token";
    } else if (!this.seedConfig.seedDetails.pricePerToken || this.seedConfig.seedDetails.pricePerToken === "0") {
      message = "Please enter a value for Funding Tokens per Project Token";
    } else if (!this.seedConfig.seedDetails.fundingTarget || this.seedConfig.seedDetails.fundingTarget === "0") {
      message = "Please enter a number greater than zero for the Funding Target";
    } else if (!this.seedConfig.seedDetails.fundingMax || this.seedConfig.seedDetails.fundingMax === "0") {
      message = "Please enter a number greater than zero for the Funding Maximum";
    } else if (BigNumber.from(this.seedConfig.seedDetails.fundingTarget).gt(this.seedConfig.seedDetails.fundingMax)) {
      message = "Please enter a value for Funding Target less than or equal to Funding Maximum";
    } else if (this.seedConfig.tokenDetails.maxSeedSupply && this.numberService.fromString(fromWei(this.seedConfig.seedDetails.fundingMax)) > this.numberService.fromString(fromWei(this.seedConfig.tokenDetails.maxSeedSupply)) * this.numberService.fromString(fromWei(this.seedConfig.seedDetails.pricePerToken))) {
      message = "Funding Maximum cannot be greater than Maximum Project Token Supply times the Funding Tokens per Project Token";
    } else if (!(this.seedConfig.seedDetails.vestingPeriod >= 0)) {
      message = "Please enter a number greater than zero for  \"Project tokens vested for\" ";
    } else if (!(this.seedConfig.seedDetails.vestingCliff >= 0)) {
      message = "Please enter a number greater than or equal to zero for \"with a cliff of\" ";
    } else if (this.seedConfig.seedDetails.vestingCliff > this.seedConfig.seedDetails.vestingPeriod) {
      message = "Please enter a value of \"with a cliff of\" less than \"Project tokens vested for \"";
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
    } else if (this.setSeedConfigEndDate() <= this.setSeedConfigStartDate()) {
      message = "Please select an End Date greater than the Start Date";
    } else if (!Utils.isValidUrl(this.seedConfig.seedDetails.whitelist, true)) {
      message = "Please enter a valid URL for Whitelist";
      // won't validate this for now
    // } else if (!(await this.whiteListService.getWhiteList(this.seedConfig.seedDetails.whitelist))) {
    //   message = "Please submit a whitelist that contains a list of addresses separated by commas or whitespace";
    } else if (!Utils.isValidUrl(this.seedConfig.seedDetails.legalDisclaimer, true)) {
      message = "Please enter a valid URL for Legal Disclaimer";
    } else if (this.seedConfig.seedDetails.legalDisclaimer &&
      !await this.disclaimerService.confirmMarkdown(this.seedConfig.seedDetails.legalDisclaimer)) {
      message = "The document at the URL you provided for Legal Disclaimer either does not exist or does not contain valid Markdown";
    } else if (!Utils.isAddress(this.seedConfig.seedDetails.adminAddress)) {
      message = "Please enter a valid wallet address for Seed Administrator";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  makeMeAdmin() : void {
    this.seedConfig.seedDetails.adminAddress = this.ethereumService.defaultAccountAddress;
  }

  getTokenInfo(): void {
    // if (this.seedConfig.tokenDetails.projectTokenAddress?.length) {
    //   if (this.lastCheckedSeedAddress !== this.seedConfig.tokenDetails.projectTokenAddress) {
    //     this.lastCheckedSeedAddress = this.seedConfig.tokenDetails.projectTokenAddress;
    //     this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.projectTokenAddress).then((tokenInfo: ITokenInfo) => {
    //       if (tokenInfo.symbol === "N/A") {
    //         throw new Error();
    //       } else {
    //         this.seedSymbol = tokenInfo.symbol;
    //         this.seedIcon = tokenInfo.logoURI;
    //       }
    //     }).catch(() => {
    //       this.validationError("Could not obtain project token information from the address supplied");
    //       this.seedSymbol = this.seedIcon = undefined;
    //     });
    //   }
    // } else {
    //   this.lastCheckedSeedAddress = this.seedSymbol = this.seedIcon = undefined;
    // }
  }
}
