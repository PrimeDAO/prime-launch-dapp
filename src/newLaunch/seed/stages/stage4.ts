import { LaunchService } from "services/LaunchService";
import { WhiteListService } from "services/WhiteListService";
import { autoinject, singleton, computedFrom, observable } from "aurelia-framework";
import { Router } from "aurelia-router";
import { DateService } from "services/DateService";
import { BaseStage } from "newLaunch/baseStage";
import Litepicker from "litepicker";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { NumberService } from "services/NumberService";
import { DisclaimerService } from "services/DisclaimerService";
import { BigNumber } from "ethers";
import { Address, capitalizeNetworkName, EthereumService, fromWei, isCeloNetworkLike } from "services/EthereumService";
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
  allowlist: Array<Address>;
  loadingAllowlist = false;
  lastWhitelistUrlValidated: string;
  tokenList: Array<ITokenInfo>;
  private fundingTokenQuestionMarkText: string;

  @observable csv: File

  constructor(
    eventAggregator: EventAggregator,
    private numberService: NumberService,
    ethereumService: EthereumService,
    router: Router,
    tokenService: TokenService,
    private tokenListService: TokenListService,
    private whiteListService: WhiteListService,
    private disclaimerService: DisclaimerService,
    private launchService: LaunchService,
  ) {
    super(router, ethereumService, eventAggregator, tokenService);
    this.eventAggregator.subscribe("launch.clearState", () => {
      this.startDate = undefined;
      this.endDate = undefined;
      this.startTime = undefined;
      this.endTime = undefined;
    });
  }

  private async csvChanged(newValue): Promise<void> {
    this.loadingAllowlist = true;
    const csvContent = newValue && await newValue[0].text();
    const rawCsvContent = new Set<string>(csvContent.split(","));
    const cleanedCsv = Array.from(rawCsvContent).map(addressCell => addressCell.replace("\n", ""));
    this.allowlist = cleanedCsv;

    this.loadingAllowlist = false;
    // for BE adds allow list param
    this.launchConfig.launchDetails.allowList = cleanedCsv;
  }

  bind(): void {
    this.setFundingTokenQuestionMarkText();
  }

  private setFundingTokenQuestionMarkText(): void {
    const addressPart = `The ${capitalizeNetworkName()} address of the token used to purchase project tokens`;
    const exampleCurrency = isCeloNetworkLike() ? "cUSD" : "DAI";
    this.fundingTokenQuestionMarkText = `${addressPart}. Simply put: The Token used to purchase your project tokens (e.g. ${exampleCurrency})`;
  }

  async attached(): Promise<void> {
    this.startDate = this.launchConfig.launchDetails.startDate && new Date(this.launchConfig.launchDetails.startDate);
    this.endDate = this.launchConfig.launchDetails.endDate && new Date(this.launchConfig.launchDetails.endDate);
    /** Could set start/end time as well, but don't care for that */

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
      this.tokenList = await this.launchService.fetchFundingTokenInfos();
    }
  }

  @computedFrom("allowlist")
  get allowlistUrlIsValid(): boolean {
    if (!this.allowlist || !this.allowlist.length) return false;

    const validAddress = [...this.allowlist]
      .filter((address: Address) => (address && Utils.isAddress(address)));
    const listIsValid = validAddress.length === this.allowlist.length;
    return listIsValid;
  }

  tokenChanged(): void {
    this.launchConfig.launchDetails.fundingTarget =
    this.launchConfig.launchDetails.fundingMax =
    this.launchConfig.launchDetails.pricePerToken = null;
  }

  togglePermissoned(): void {
    this.launchConfig.launchDetails.isPermissoned = !this.launchConfig.launchDetails.isPermissoned;
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
    // TODO: Refactor after BE enables allowlists:
    // this.wizardState.whiteList = this.launchConfig.launchDetails.whitelist;
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
    } else if (!this.launchConfig.launchDetails.pricePerToken) {
      message = "Please enter a value for Project Token Exchange Ratio";
    } else if (!this.launchConfig.launchDetails.fundingTarget || this.launchConfig.launchDetails.fundingTarget === "0") {
      message = "Please enter a number greater than zero for the Funding Target";
    } else if (!this.launchConfig.launchDetails.fundingMax || this.launchConfig.launchDetails.fundingMax === "0") {
      message = "Please enter a number greater than zero for the Funding Maximum";
    } else if (!this.launchConfig.launchDetails.individualCap || this.launchConfig.launchDetails.individualCap === "0") {
      message = "Please enter a number greater than zero for the Funding Token Contribution Limit";
    } else if (this.launchConfig.tokenDetails.projectTokenInfo.address === this.launchConfig.launchDetails.fundingTokenInfo.address) {
      message = "Funding Token and Project Token cannot be the same. Please reenter one or the other.";
    } else if (BigNumber.from(this.launchConfig.launchDetails.fundingTarget).gt(this.launchConfig.launchDetails.fundingMax)) {
      message = "Please enter a value for Funding Target less than or equal to Funding Maximum";
    } else if (this.launchConfig.tokenDetails.maxSupply &&
      this.numberService.fromString(fromWei(this.launchConfig.launchDetails.fundingMax, this.launchConfig.launchDetails.fundingTokenInfo.decimals)) >
      (this.numberService.fromString(fromWei(this.launchConfig.tokenDetails.maxSupply, this.launchConfig.tokenDetails.projectTokenInfo.decimals)) *
        this.launchConfig.launchDetails.pricePerToken)) {
      message = "Funding Maximum cannot be greater than Maximum Project Token Supply times the Project Token Exchange Ratio";
    } else if (!this.numberService.stringIsNumber(this.launchConfig.launchDetails.vestingPeriod) || this.launchConfig.launchDetails.vestingPeriod < 0) {
      message = "Please enter a number greater than or equal to zero for \"Project tokens vested for\" ";
    } else if (!this.numberService.stringIsNumber(this.launchConfig.launchDetails.vestingCliff) || this.launchConfig.launchDetails.vestingCliff < 0) {
      message = "Please enter a number greater than or equal to zero for \"with a cliff of\" ";
    } else if (this.launchConfig.launchDetails.vestingCliff > this.launchConfig.launchDetails.vestingPeriod) {
      message = "Please enter a value of \"with a cliff of\" less than \"Project tokens vested for\"";
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
      message = "Please enter a valid wallet address for the Seed Administrator";
    } else if (this.launchConfig.launchDetails.seedTip > 45) {
      message = "Please enter a number lower than or equal to 45% for the tips";
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
}
