import { WhiteListService } from "services/WhiteListService";
import { autoinject, singleton, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";
import { DateService } from "services/DateService";
import { BaseStage } from "newLaunch/baseStage";
import Litepicker from "litepicker";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { NumberService } from "services/NumberService";
import { DisclaimerService } from "services/DisclaimerService";
import { BigNumber } from "ethers";
import { Address, EthereumService, fromWei } from "services/EthereumService";
import { ITokenInfo, TokenService } from "services/TokenService";
import { TokenListService } from "services/TokenListService";
import { ISeedConfig } from "newLaunch/seed/config";

@singleton(false)
@autoinject
export class Stage4 extends BaseStage<ISeedConfig> {
  launchConfig: ISeedConfig;
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
  tokenList: Array<string>;

  constructor(
    eventAggregator: EventAggregator,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    router: Router,
    tokenService: TokenService,
    private tokenListService: TokenListService,
    private whiteListService: WhiteListService,
    private disclaimerService: DisclaimerService,
  ) {
    super(router, eventAggregator, tokenService);
    this.eventAggregator.subscribe("launch.clearState", () => {
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

    if (!this.tokenList) {
      // eslint-disable-next-line require-atomic-updates
      if (process.env.NETWORK === "mainnet") {
        const tokenInfos = this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments);
        this.tokenList = tokenInfos.map((tokenInfo: ITokenInfo) => tokenInfo.address);
      } else {
        this.tokenList =
          [
            "0x80E1B5fF7dAdf3FeE78F60D69eF1058FD979ca64",
            "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
            "0x7ba433d48c43e3ceeb2300bfbf21db58eecdcd1a", // USDC having 6 decimals
          ];
      }
    }
  }

  @computedFrom("launchConfig.launchDetails.whitelist")
  get whitelistUrlIsValid(): boolean {
    return Utils.isValidUrl(this.launchConfig.launchDetails.whitelist);
  }

  @computedFrom("launchConfig.launchDetails.whitelist", "lastWhitelistUrlValidated")
  get currentWhitelistIsValidated(): boolean {
    return this.lastWhitelistUrlValidated === this.launchConfig.launchDetails.whitelist;
  }

  tokenChanged(_value: string, _index: number): void {
    this.launchConfig.launchDetails.fundingTarget =
    this.launchConfig.launchDetails.fundingMax =
    this.launchConfig.launchDetails.pricePerToken = null;
  }

  toggleGeoBlocking(): void {
    this.launchConfig.launchDetails.geoBlock = !this.launchConfig.launchDetails.geoBlock;
  }

  setlaunchConfigStartDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const startTimes = this.startTime.split(":");
    const temp = this.startDate;
    temp.setHours(Number.parseInt(startTimes[0]), Number.parseInt(startTimes[1]));
    this.launchConfig.launchDetails.startDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.launchConfig.launchDetails.startDate);
  }

  setlaunchConfigEndDate(): Date {
    // Set the ISO time
    // Get the start and end time
    const endTimes = this.endTime.split(":");
    const temp = this.endDate;
    temp.setHours(Number.parseInt(endTimes[0]), Number.parseInt(endTimes[1]));
    this.launchConfig.launchDetails.endDate = this.dateService.toISOString(this.dateService.translateLocalToUtc(temp));
    return new Date(this.launchConfig.launchDetails.endDate);
  }

  persistData(): void {
    this.setlaunchConfigStartDate();
    this.setlaunchConfigEndDate();
    // Save the admin address to wizard state in order to persist it after launchConfig state is cleared in stage7
    this.wizardState.launchAdminAddress = this.launchConfig.launchDetails.adminAddress;
    this.wizardState.whiteList = this.launchConfig.launchDetails.whitelist;
    this.wizardState.launchStartDate = this.launchConfig.launchDetails.startDate;
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
    if (!Utils.isAddress(this.launchConfig.launchDetails.fundingTokenInfo.address)) {
      message = "Please select a Funding Token seed";
    } else if (!this.launchConfig.launchDetails.pricePerToken || this.launchConfig.launchDetails.pricePerToken === "0") {
      message = "Please enter a value for Project Token Exchange Ratio";
    } else if (!this.launchConfig.launchDetails.fundingTarget || this.launchConfig.launchDetails.fundingTarget === "0") {
      message = "Please enter a number greater than zero for the Funding Target";
    } else if (!this.launchConfig.launchDetails.fundingMax || this.launchConfig.launchDetails.fundingMax === "0") {
      message = "Please enter a number greater than zero for the Funding Maximum";
    } else if (this.launchConfig.tokenDetails.projectTokenInfo.address === this.launchConfig.launchDetails.fundingTokenInfo.address) {
      message = "Funding Token and Project Token cannot be the same. Please reenter one or the other.";
    } else if (BigNumber.from(this.launchConfig.launchDetails.fundingTarget).gt(this.launchConfig.launchDetails.fundingMax)) {
      message = "Please enter a value for Funding Target less than or equal to Funding Maximum";
    } else if (this.launchConfig.tokenDetails.maxSupply &&
      this.numberService.fromString(fromWei(this.launchConfig.launchDetails.fundingMax, this.launchConfig.launchDetails.fundingTokenInfo.decimals)) >
      this.numberService.fromString(fromWei(this.launchConfig.tokenDetails.maxSupply, this.launchConfig.tokenDetails.projectTokenInfo.decimals)) *
        this.numberService.fromString(fromWei(this.launchConfig.launchDetails.pricePerToken, this.launchConfig.launchDetails.fundingTokenInfo.decimals))) {
      message = "Funding Maximum cannot be greater than Maximum Project Token Supply times the Project Token Exchange Ratio";
    } else if (!(this.launchConfig.launchDetails.vestingPeriod >= 0)) {
      message = "Please enter a number greater than zero for  \"Project tokens vested for\" ";
    } else if (!(this.launchConfig.launchDetails.vestingCliff >= 0)) {
      message = "Please enter a number greater than or equal to zero for \"with a cliff of\" ";
    } else if (this.launchConfig.launchDetails.vestingCliff > this.launchConfig.launchDetails.vestingPeriod) {
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
    } else if (this.setlaunchConfigEndDate() <= this.setlaunchConfigStartDate()) {
      message = "Please select an End Date greater than the Start Date";
    } else if (!Utils.isValidUrl(this.launchConfig.launchDetails.whitelist, true)) {
      message = "Please enter a valid URL for Whitelist";
    } else if (!!this.launchConfig.launchDetails.whitelist && !(await this.whiteListService.getWhiteList(this.launchConfig.launchDetails.whitelist))) {
      message = "Whitelist cannot be fetched or parsed. Please enter a URL to a whitelist that conforms to the given formatting rules";
    } else if (!Utils.isValidUrl(this.launchConfig.launchDetails.legalDisclaimer, true)) {
      message = "Please enter a valid URL for Legal Disclaimer";
    } else if (this.launchConfig.launchDetails.legalDisclaimer &&
      !await this.disclaimerService.confirmMarkdown(this.launchConfig.launchDetails.legalDisclaimer)) {
      message = "The document at the URL you provided for Legal Disclaimer either does not exist or does not contain valid Markdown";
    } else if (!Utils.isAddress(this.launchConfig.launchDetails.adminAddress)) {
      message = "Please enter a valid wallet address for Seed Administrator";
    }

    this.stageState.verified = !message;
    return Promise.resolve(message);
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  makeMeAdmin() : void {
    this.launchConfig.launchDetails.adminAddress = this.ethereumService.defaultAccountAddress;
  }

  async getWhiteListFeedback(): Promise<void> {
    if (this.launchConfig.launchDetails.whitelist) {
      this.loadingWhitelist = true;
      this.whitelist = await this.whiteListService.getWhiteList(this.launchConfig.launchDetails.whitelist);
      this.lastWhitelistUrlValidated = this.launchConfig.launchDetails.whitelist;
      this.loadingWhitelist = false;
    } else {
      this.whitelist = null;
    }
  }
}
