import { DialogService } from "./../services/DialogService";
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
import { NumberService } from "services/numberService";
import { DisposableCollection } from "services/DisposableCollection";
import { GeoBlockService } from "services/GeoBlockService";

@autoinject
export class SeedDashboard {
  address: Address;

  subscriptions: DisposableCollection = new DisposableCollection();

  seed: Seed;
  loading = true;
  // seedTokenToReceive = 1;
  fundingTokenToPay: BigNumber;
  seedTokenToReceive: BigNumber;
  progressBar: HTMLElement;
  bar: HTMLElement;
  fractionComplete: number;

  userFundingTokenBalance: BigNumber;
  userFundingTokenAllowance: BigNumber;

  geoBlocked: boolean;

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private geoBlockService: GeoBlockService,
    private dialogService: DialogService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("seed.userCurrentFundingContributions", "seed.retrievingIsOpen")
  get userCanRetrieve(): boolean { return this.seed.retrievingIsOpen && this.seed.userCurrentFundingContributions?.gt(0); }

  @computedFrom("fundingTokenToPay", "seed.fundingTokensPerSeedToken")
  get seedTokenReward(): number { return (this.numberService.fromString(fromWei(this.fundingTokenToPay ?? "0"))) / this.seed?.fundingTokensPerSeedToken; }

  /** TODO: don't use current balance */
  @computedFrom("seed.seedRemainder", "seed.cap")
  get percentSeedTokensLeft(): number {
    return (!(this.seed?.cap.gt(0) ?? false)) ? undefined :
      (this.numberService.fromString(fromWei(this.seed.seedRemainder)) /
      this.numberService.fromString(fromWei(this.seed.cap))) * 100;
  }

  @computedFrom("userFundingTokenBalance", "fundingTokenToPay")
  get userCanPay(): boolean { return this.userFundingTokenBalance?.gt(this.fundingTokenToPay ?? "0"); }

  @computedFrom("userFundingTokenAllowance", "fundingTokenToPay")
  get lockRequired(): boolean { return !!this.userFundingTokenAllowance?.lt(this.fundingTokenToPay ?? "0"); }

  @computedFrom("seed", "ethereumService.defaultAccountAddress")
  private get seedDisclaimerStatusKey() {
    return `seed-disclaimer-${this.seed?.address}-${this.ethereumService.defaultAccountAddress}`;
  }

  private get seedDisclaimed(): boolean {
    return this.ethereumService.defaultAccountAddress && (localStorage.getItem(this.seedDisclaimerStatusKey) === "true");
  }

  public async canActivate(params: { address: Address }): Promise<boolean> {
    const seed = this.seedService.seeds?.get(params.address);
    /**
     * main interest here is literally to prevent access to seeds that don't
     * yet have seed tokens
     */
    return seed?.hasSeedTokens;
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
        this.eventAggregator.publish("seeds.loading", true);
        waiting = true;
        await this.seedService.ensureInitialized();
      }
      const seed = this.seedService.seeds.get(this.address);
      if (seed.initializing) {
        if (!waiting) {
          await Utils.sleep(200);
          this.eventAggregator.publish("seeds.loading", true);
          waiting = true;
        }
        await seed.ensureInitialized();
      }
      this.seed = seed;

      await this.hydrateUserData();
      this.fractionComplete = this.numberService.fromString(fromWei(this.seed.amountRaised)) /
        this.numberService.fromString(fromWei(this.seed.target));

      this.bar.style.width = `${this.progressBar.clientWidth * Math.min(.5, 1.0)}px`;

      //this.disclaimSeed();

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      if (waiting) {
        this.eventAggregator.publish("seeds.loading", false);
      }
      this.loading = false;
    }
  }

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      this.userFundingTokenBalance = await this.seed.fundingTokenContract.balanceOf(this.ethereumService.defaultAccountAddress);
      this.userFundingTokenAllowance = await this.seed.fundingTokenAllowance();
    }
  }

  linkIcons = new Map<string, string>([
    ["twitter", "fab fa-twitter"],
    ["telegram", "fab fa-telegram-plane"],
    ["discord", "fab fa-discord"],
    ["medium", "fab fa-medium-m"],
    ["github", "fab fa-github"],
    ["website", "fa fa-globe-americas"],
    ["misc", "fa fa-external-link-alt"],
    ["home", "fas fa-home"],
    ["pdf", "fas fa-file-pdf"],
  ]);

  iconClassForLinkType(type: string): string {
    return this.linkIcons.get(type.toLowerCase()) ?? this.linkIcons.get("misc");
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean { return !!this.ethereumService.defaultAccountAddress; }

  async disclaimSeed(): Promise<boolean> {

    let disclaimed = false;

    if (!this.seed.metadata.seedDetails.legalDisclaimer || this.seedDisclaimed) {
      disclaimed = true;
    } else {
      // const response = await this.dialogService.disclaimer("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/README.md");
      const response = await this.dialogService.disclaimer(
        this.seed.metadata.seedDetails.legalDisclaimer,
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
          localStorage.setItem(this.seedDisclaimerStatusKey, "true");
        }
        disclaimed = response.output as boolean;
      }
    }
    return disclaimed;
  }

  handleMaxBuy() : void {
    this.fundingTokenToPay = this.userFundingTokenBalance;
  }

  handleMaxClaim(): void {
    this.seedTokenToReceive = this.seed.userClaimableAmount;
  }

  unlockFundingTokens(): void {
    if (this.seed.unlockFundingTokens(this.fundingTokenToPay)) {
      this.hydrateUserData();
    }
  }

  async buy(): Promise<void> {
    if (!this.fundingTokenToPay?.gt(0)) {
      this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.seed.fundingTokenInfo.symbol} you wish to contribute`);
    } else if (this.userFundingTokenBalance.lt(this.fundingTokenToPay)) {
      this.eventAggregator.publish("handleValidationError", `Your ${this.seed.fundingTokenInfo.symbol} balance is insufficient to cover what you want to pay`);
    } else if (await this.disclaimSeed()) {
      this.seed.buy(this.fundingTokenToPay);
    }
  }

  claim(): void {
    if (this.seed.claimingIsOpen && this.seed.userCanClaim) {
      if (!this.seedTokenToReceive?.gt(0)) {
        this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.seed.seedTokenInfo.symbol} you wish to receive`);
      } else if (this.seed.userClaimableAmount.lt(this.seedTokenToReceive)) {
        this.eventAggregator.publish("handleValidationError", `The amount of ${this.seed.seedTokenInfo.symbol} you are requesting exceeds your claimable amount`);
      } else {
        this.seed.claim(this.seedTokenToReceive);
      }
    }
  }

  retrieve(): void {
    if (this.userCanRetrieve) {
      this.seed.retrieveFundingTokens();
    }
  }
}
