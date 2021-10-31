import { BrowserStorageService } from "./../services/BrowserStorageService";
import { Router } from "aurelia-router";
import { DisclaimerService } from "./../services/DisclaimerService";
import { EthereumService, fromWei } from "./../services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import { Address } from "services/EthereumService";
import "./seedDashboard.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";
import { EventConfigException } from "services/GeneralEvents";
import { EventAggregator } from "aurelia-event-aggregator";
import { BigNumber } from "ethers";
import { NumberService } from "services/NumberService";
import { DisposableCollection } from "services/DisposableCollection";
import { GeoBlockService } from "services/GeoBlockService";
import { CongratulationsService } from "services/CongratulationsService";

@autoinject
export class SeedDashboard {
  address: Address;

  subscriptions: DisposableCollection = new DisposableCollection();

  seed: Seed;
  loading = true;
  // projectTokenToReceive = 1;
  fundingTokenToPay: BigNumber;
  projectTokenToReceive: BigNumber;
  progressBar: HTMLElement;
  bar: HTMLElement;

  userFundingTokenAllowance: BigNumber;

  geoBlocked: boolean;

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private geoBlockService: GeoBlockService,
    private disclaimerService: DisclaimerService,
    private router: Router,
    private storageService: BrowserStorageService,
    private congratulationsService: CongratulationsService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("seed.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.seed?.userHydrated;
  }

  @computedFrom("seed.amountRaised", "seed.target")
  get fractionComplete(): number {

    let fraction = 0;
    if (this.seed?.target) {
      fraction = this.numberService.fromString(fromWei(this.seed.amountRaised, this.seed.fundingTokenInfo.decimals)) /
        this.numberService.fromString(fromWei(this.seed.target, this.seed.fundingTokenInfo.decimals));
    }

    if (fraction === 0) {
      this.progressBar.classList.add("hide");
    } else {
      this.progressBar.classList.remove("hide");
    }
    this.bar.style.width = `${Math.min(fraction, 1.0)*100}%`;

    return fraction;
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

  @computedFrom("maxFundable", "seed.userFundingTokenBalance")
  get maxUserCanPay(): BigNumber { return this.maxFundable.lt(this.seed.userFundingTokenBalance) ? this.maxFundable : this.seed.userFundingTokenBalance; }

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

  public async canActivate(params: { address: Address }): Promise<boolean> {
    await this.seedService.ensureInitialized();
    const seed = this.seedService.seeds?.get(params.address);
    await seed.ensureInitialized();
    return seed?.canGoToDashboard;
  }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
    this.geoBlocked = this.geoBlockService.blackisted;
  }

  async attached(): Promise<void> {
    let waiting = false;

    try {
      if (this.seedService.initializing) {
        await Utils.sleep(200);
        this.eventAggregator.publish("launches.loading", true);
        waiting = true;
        await this.seedService.ensureInitialized();
      }
      const seed = this.seedService.seeds.get(this.address);
      if (seed.initializing) {
        if (!waiting) {
          await Utils.sleep(200);
          this.eventAggregator.publish("launches.loading", true);
          waiting = true;
        }
        await seed.ensureInitialized();
      }
      this.seed = seed;
      this.geoBlocked = this.geoBlocked && this.seed.metadata.launchDetails.geoBlock;
      await this.hydrateUserData();

      //this.disclaimSeed();

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

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      this.userFundingTokenAllowance = await this.seed.fundingTokenAllowance();
    }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
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

  handleMaxBuy() : void {
    this.fundingTokenToPay = this.maxUserCanPay;
  }

  handleMaxClaim(): void {
    this.projectTokenToReceive = this.seed.userClaimableAmount;
  }

  async validateClosedOrPaused(): Promise<boolean> {
    const closedOrPaused = await this.seed.hydateClosedOrPaused();
    if (closedOrPaused) {
      this.eventAggregator.publish("handleValidationError", "Sorry, this seed has been closed or paused");
      this.router.navigate("/home");
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

  async claim(): Promise<void> {
    if (this.seed.claimingIsOpen && this.seed.userCanClaim) {
      if (!this.projectTokenToReceive?.gt(0)) {
        this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.seed.projectTokenInfo.symbol} you wish to receive`);
      } else if (this.seed.userClaimableAmount.lt(this.projectTokenToReceive)) {
        this.eventAggregator.publish("handleValidationError", `The amount of ${this.seed.projectTokenInfo.symbol} you are requesting exceeds your claimable amount`);
      } else {
        this.seed.claim(this.projectTokenToReceive);
      }
    }
  }

  async retrieve(): Promise<void> {
    if (this.seed.userCanRetrieve) {
      this.seed.retrieveFundingTokens()
        .then((receipt) => {
          if (receipt) {
            this.hydrateUserData();
          }
        });
    }
  }
}
