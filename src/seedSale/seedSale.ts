import { TokenService } from "services/TokenService";
/* eslint-disable linebreak-style */
import "./seedSale.scss";
import { autoinject, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";
import { IContributorClass, Seed } from "entities/Seed";
import { Address, EthereumService, fromWei, toWei } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { TransactionReceipt } from "services/TransactionsService";
import { SeedService } from "services/SeedService";
import { CongratulationsService } from "services/CongratulationsService";
import { Utils } from "services/utils";
import { EventConfigException } from "services/GeneralEvents";
import { GeoBlockService } from "services/GeoBlockService";
import { BigNumber } from "ethers";
import { DateService, TimespanResolution } from "services/DateService";
import { NumberService } from "services/NumberService";
import { DisclaimerService } from "services/DisclaimerService";
import { BrowserStorageService } from "services/BrowserStorageService";
import dayjs from "dayjs";
import { LaunchService } from "services/LaunchService";
import moment from "moment";
import { BigNumberService } from "services/BigNumberService";

enum Phase {
  None = "None",
  Mining = "Mining",
  Confirming = "Confirming"
}

@autoinject
export class SeedSale {
  address: Address
  subscriptions: DisposableCollection = new DisposableCollection();
  loading: boolean;
  seed: Seed;
  userFundingTokenAllowance: BigNumber;
  timeLeft: string
  fundingTokenToPay: BigNumber;
  projectTokenToReceive: BigNumber;
  userTokenBalance: string
  userUsdBalance: number

  classCap: number;
  classSold: string;
  classPrice: number;

  lockDate: string;
  vestingDate: string;

  private accountAddress: Address = null;
  private txPhase = Phase.None;
  private txReceipt: TransactionReceipt;
  // @ts-ignore
  private targetClass: IContributorClass = {};

  constructor(
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private router: Router,
    private congratulationsService: CongratulationsService,
    private geoBlockService: GeoBlockService,
    private dateService: DateService,
    private tokenService: TokenService,
    private disclaimerService: DisclaimerService,
    private storageService: BrowserStorageService,
    private launchService: LaunchService,
    private bigNumberService: BigNumberService,
  ){
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.hydrateUserData();
    }));
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      this.accountAddress = account;
      this.txPhase = Phase.None;
      this.txReceipt = null;
    }));
  }

  onAdminButtonClick(): void {
    this.router.navigate(`/admin/seeds/dashboard/${this.address}`);
  }

  formatLink(link: string): string {
    return this.launchService.formatLink(link);
  }

  @computedFrom("seed.amountRaised", "seed.target")
  get fractionComplete(): number {

    let fraction = 0;
    if (this.seed?.target) {
      fraction = this.numberService.fromString(fromWei(this.seed.amountRaised, this.seed.fundingTokenInfo.decimals)) /
        this.numberService.fromString(fromWei(this.seed.target, this.seed.fundingTokenInfo.decimals));
    }
    return fraction;
  }

  @computedFrom("seed.amountRaised", "seed.target")
  get fractionCompleteForBar(): number {

    let fraction = 0;
    if (this.seed?.target) {
      fraction = this.numberService.fromString(fromWei(this.seed.amountRaised, this.seed.fundingTokenInfo.decimals)) /
        this.numberService.fromString(fromWei(this.seed.target, this.seed.fundingTokenInfo.decimals));
    }
    return Math.min(fraction, 1.0)*100;
  }

  @computedFrom("seed.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.seed?.userHydrated;
  }

  @computedFrom("seed.amountRaised")
  get maxFundable(): BigNumber { return this.seed.cap.sub(this.seed.amountRaised); }

  @computedFrom("fundingTokenToPay", "seed.fundingTokensPerProjectToken")
  get projectTokenReward(): number {
    return (this.seed?.fundingTokensPerProjectToken > 0) ?
      (this.numberService.fromString(fromWei(this.fundingTokenToPay ?? "0", this.seed.fundingTokenInfo.decimals))) / this.seed?.fundingTokensPerProjectToken
      : 0;
  }

  /** TODO: don't use current balance */
  @computedFrom("seed.seedRemainder", "seed.seedAmountRequired")
  get percentProjectTokensLeft(): number {
    return this.seed?.seedAmountRequired?.gt(0) ?
      ((this.numberService.fromString(fromWei(this.seed.seedRemainder, this.seed.projectTokenInfo.decimals)) /
        this.numberService.fromString(fromWei(this.seed.seedAmountRequired, this.seed.projectTokenInfo.decimals))) * 100)
      : 0;
  }

  @computedFrom("seed.userFundingTokenBalance", "fundingTokenToPay")
  get userCanPay(): boolean { return this.seed.userFundingTokenBalance?.gt(this.fundingTokenToPay ?? "0"); }

  @computedFrom("targetClass.individualCap", "targetClass.classCap", "maxFundable", "seed.userFundingTokenBalance")
  get maxUserCanPay(): BigNumber {
    // /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: seedSale.ts ~ line 143 ~ this.targetClass.individualCap", this.targetClass.individualCap);
    // /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: seedSale.ts ~ line 145 ~ this.targetClass.classCap", this.targetClass.classCap);
    // /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: seedSale.ts ~ line 147 ~ this.seed.userFundingTokenBalance", this.seed.userFundingTokenBalance);
    // /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: seedSale.ts ~ line 156 ~ this.maxFundable", this.maxFundable);
    const min = this.bigNumberService.min([
      this.targetClass.individualCap,
      this.targetClass.classCap,
      this.seed.userFundingTokenBalance,
      this.maxFundable,
    ]);
    return min;
    // return this.maxFundable.lt(this.seed.userFundingTokenBalance || "0")
    //   ? this.maxFundable
    //   : this.seed.userFundingTokenBalance;
  }

  @computedFrom("maxUserCanPay")
  get maxUserTokenBalance(): string {
    const tokenBalance = this.maxUserCanPay ? fromWei(this.maxUserCanPay) : "0";
    return tokenBalance;
  }

  @computedFrom("maxUserTokenBalance", "seed.fundingTokenInfo.price")
  get maxUserUsdBalance(): number {
    const usdBalance = this.numberService.fromString(this.maxUserTokenBalance) * this.seed.fundingTokenInfo.price;
    return usdBalance;
  }

  @computedFrom("userFundingTokenAllowance", "fundingTokenToPay")
  get lockRequired(): boolean {
    return this.userFundingTokenAllowance?.lt(this.fundingTokenToPay ?? "0") &&
      this.maxUserCanPay.gte(this.fundingTokenToPay ?? "0"); }

  @computedFrom("seed", "ethereumService.defaultAccountAddress")
  private get seedDisclaimerStatusKey() {
    return `seed-disclaimer-${this.seed?.address}-${this.ethereumService.defaultAccountAddress}`;
  }

  private get seedDisclaimed(): boolean {
    return this.ethereumService.defaultAccountAddress && (this.storageService.lsGet(this.seedDisclaimerStatusKey, "false") === "true");
  }

  handleMaxBuy() : void {
    this.fundingTokenToPay = this.maxUserCanPay;
  }

  handleMaxClaim(): void {
    this.projectTokenToReceive = this.seed.userClaimableAmount;
  }

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      this.userFundingTokenAllowance = await this.seed?.fundingTokenAllowance();
    }
  }

  getTimeLeft(): void {
    const now = dayjs();
    const startDate = dayjs(this.seed.startTime);
    const endDate = dayjs(this.seed.endTime);

    let diff = endDate.diff(now, "minutes");

    const diffDays = Math.floor(diff / 60 / 24);
    diff = diff - (diffDays*60*24);
    const diffHours = Math.floor(diff / 60);

    const endTitle = this.seed?.hasNotStarted ? "" : "left";

    if (now.diff(startDate) > 0) {
      const title = this.seed?.hasNotStarted ? "Starts in " : "";
      this.timeLeft = diffDays > 1 ? `${title}${diffDays} day${diffDays > 1 ? "s" : ""} ${endTitle}`: `${title}${diffHours} hours ${endTitle}`;
    } else {
      const soon = 86400000;

      const myDate = Number(now.diff(startDate).toString().replace("-", ""));

      const days = Math.floor(moment.duration(myDate, "milliseconds").asDays());
      const hours = Math.floor(moment.duration(myDate, "milliseconds").asHours());
      const milliseconds = Math.floor(moment.duration(myDate, "milliseconds").asMilliseconds());

      const title = "Starts in ";

      this.timeLeft = milliseconds < soon && hours <= 24 ? `${title}${hours} hours ${endTitle}` : `${title}${days.toString().replace("-", "")} days ${endTitle}`;
    }
  }

  exponentialToDecimal(exponential: number): string {
    let decimal = exponential.toString().toLowerCase();
    if (decimal.includes("e+")) {
      const exponentialSplitted = decimal.split("e+");
      let postfix = "";
      for (
        let i = 0; i <
        +exponentialSplitted[1] -
        (exponentialSplitted[0].includes(".") ? exponentialSplitted[0].split(".")[1].length : 0); i++
      ) {
        postfix += "0";
      }
      const addCommas = text => {
        let j = 3;
        let textLength = text.length;
        while (j < textLength) {
          text = `${text.slice(0, textLength - j)},${text.slice(textLength - j, textLength)}`;
          textLength++;
          j += 3 + 1;
        }
        return text;
      };
      decimal = addCommas(exponentialSplitted[0].replace(".", "") + postfix);
    }
    if (decimal.toLowerCase().includes("e-")) {
      const exponentialSplitted = decimal.split("e-");
      let prefix = "0.";
      for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
        prefix += "0";
      }
      decimal = prefix + exponentialSplitted[0].replace(".", "");
    }
    return decimal;
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
  }

  async attached(): Promise<void> {
    let waiting = false;
    this.loading = true;

    this.accountAddress = this.ethereumService.defaultAccountAddress;

    try {
      if (this.seedService.initializing) {
        await Utils.sleep(200);
        this.eventAggregator.publish("launches.loading", true);
        waiting = true;
        await this.seedService.ensureInitialized();
      }
      const seed = this.seedService.seeds.get(this.address);
      if (!seed) {
        throw new Error("Failed to instantiate Seed");
      }
      if (seed.initializing) {
        if (!waiting) {
          await Utils.sleep(200);
          this.eventAggregator.publish("launches.loading", true);
          waiting = true;
        }
        await seed.ensureInitialized();
      }
      this.seed = seed;
      this.getTimeLeft();
      this.userTokenBalance = this.maxUserTokenBalance;
      this.userUsdBalance = this.maxUserUsdBalance;
      await this.hydrateUserData();
      //this.disclaimSeed();

      this.targetClass = this.findUserClass(this.seed);

      this.lockDate = this.targetClass.classVestingCliff && this.dateService.ticksToTimeSpanString(this.targetClass.classVestingCliff.toNumber() * 1000, TimespanResolution.largest);
      this.vestingDate = this.targetClass.classVestingDuration && this.dateService.ticksToTimeSpanString(this.targetClass.classVestingDuration.toNumber() * 1000, TimespanResolution.largest);


      this.classCap = this.seed.classCap;
      let fundRatioForClass = this.targetClass.classFundingCollected.div(this.targetClass.classCap);
      fundRatioForClass = fundRatioForClass.mul(toWei(100, this.seed.fundingTokenInfo.decimals));
      this.classSold = `${fundRatioForClass}%`;

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      if (waiting) {
        this.eventAggregator.publish("launches.loading", false);
      }
      this.loading = false;
    }
  }

  private findUserClass(seed: Seed): any {
    const onlyDefaultClass = seed.classes.length === 1;
    if (onlyDefaultClass) {
      return seed.classes[0];
    }

    // TODO
    return seed.classes[0];
  }

  async disclaimSeed(): Promise<boolean> {

    let disclaimed = false;

    if (!this.seed.metadata.launchDetails.legalDisclaimer || this.seedDisclaimed) {
      disclaimed = true;
    } else {
      // const response = await this.dialogService.disclaimer("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/README.md");
      const response = await this.disclaimerService.showDisclaimer(
        this.seed.metadata.launchDetails.legalDisclaimer,
        `${this.seed.metadata.general.projectName} Disclaimer`,
      );

      if (typeof response.output === "string") {
      // then an error occurred
        this.eventAggregator.publish("handleFailure", response.output);
        disclaimed = false;
      } else if (response.wasCancelled) {
        disclaimed = false;
      } else {
        if (response.output) {
          this.storageService.lsSet(this.seedDisclaimerStatusKey, "true");
        }
        disclaimed = response.output as boolean;
      }
    }
    return disclaimed;
  }

  async validateClosedOrPaused(): Promise<boolean> {
    const closedOrPaused = await this.seed.hydateClosedOrPaused();
    if (closedOrPaused) {
      this.eventAggregator.publish("handleValidationError", "Sorry, this seed is closed or has been paused by the launch administrator.");
      return true;
    } else {
      return false;
    }
  }

  async unlockFundingTokens(): Promise<void> {
    if (await this.validateClosedOrPaused()) {
      return;
    }

    if (await this.disclaimSeed()) {
      this.seed.unlockFundingTokens(this.fundingTokenToPay)
        .then((receipt) => {
          if (receipt) {
            this.hydrateUserData();
            // this.congratulationsService.show(`You have unlocked ${this.numberService.toString(fromWei(this.fundingTokenToPay, this.seed.fundingTokenInfo.decimals), { thousandSeparated: true })} ${this.seed.fundingTokenInfo.symbol}.  The last step is to click the Contribute button!`);
          }
        });
    }
  }

  async buy(): Promise<void> {
    if (await this.validateClosedOrPaused()) {
      return;
    }

    if (!this.fundingTokenToPay?.gt(0)) {
      this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.seed.fundingTokenInfo.symbol} you wish to contribute`);
    } else if (this.seed.userFundingTokenBalance.lt(this.fundingTokenToPay)) {
      this.eventAggregator.publish("handleValidationError", `Your ${this.seed.fundingTokenInfo.symbol} balance is insufficient to cover what you want to pay`);
    } else if (this.fundingTokenToPay.add(this.seed.amountRaised).gt(this.seed.cap)) {
      this.eventAggregator.publish("handleValidationError", `The amount of ${this.seed.fundingTokenInfo.symbol} you wish to contribute will cause the funding maximum to be exceeded`);
    } else if (this.lockRequired) {
      this.eventAggregator.publish("handleValidationError", `Please click UNLOCK to approve the transfer of your ${this.seed.fundingTokenInfo.symbol} to the Seed contract`);
    } else if (await this.disclaimSeed()) {
      this.seed.buy(this.fundingTokenToPay)
        .then(async (receipt) => {
          if (receipt) {
            await this.hydrateUserData();
            this.congratulationsService.show(`You have contributed ${this.numberService.toString(fromWei(this.fundingTokenToPay, this.seed.fundingTokenInfo.decimals), { thousandSeparated: true })} ${this.seed.fundingTokenInfo.symbol} to ${this.seed.metadata.general.projectName}!`);
            this.fundingTokenToPay = null;
          }
        });
    }
  }
}

