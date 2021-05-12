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

  msRemainingInPeriodCountdown: number;

  constructor(
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("seed.userClaimableAmount", "seed.minimumReached")
  get userCanClaim(): boolean { return this.seed?.userClaimableAmount?.gt(0) && this.seed?.minimumReached; }

  @computedFrom("fundingTokenToPay", "seed.fundingTokensPerSeedToken")
  get seedTokenReward(): number { return (this.numberService.fromString(fromWei(this.fundingTokenToPay ?? "0"))) * this.seed?.fundingTokensPerSeedToken; }

  @computedFrom("seedTokenReward", "seed.seedTokenInfo.price")
  get seedTokenRewardPrice(): number { return this.seedTokenReward * this.seed?.seedTokenInfo.price; }

  /** TODO: don't use current balance */
  @computedFrom("seed.seedTokenCurrentBalance", "seed.cap")
  get seedTokensLeft(): BigNumber { return this.seed?.seedTokenCurrentBalance?.div(this.seed.cap); }

  @computedFrom("userFundingTokenBalance", "fundingTokenToPay")
  get userCanPay(): boolean { return this.userFundingTokenBalance?.gt(this.fundingTokenToPay ?? "0"); }

  @computedFrom("userFundingTokenAllowance", "fundingTokenToPay")
  get lockRequired(): boolean { return !!this.userFundingTokenAllowance?.lt(this.fundingTokenToPay ?? "0"); }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
    return this.load();
  }

  attached(): void {
    this.fractionComplete = this.numberService.fromString(fromWei(this.seed.amountRaised)) /
      this.numberService.fromString(fromWei(this.seed.target));
    this.bar.style.width = `${this.progressBar.clientWidth * Math.min(this.fractionComplete, 1.0)}px`;
  }

  async load(): Promise<void> {
    let waiting = false;
    try {
      if (this.seedService.initializing) {
        await Utils.sleep(200);
        this.eventAggregator.publish("seeds.loading", true);
        waiting = true;
        await this.seedService.ensureInitialized();
      }
      this.seed = this.seedService.seeds.get(this.address);
      if (this.seed.initializing) {
        if (!waiting) {
          await Utils.sleep(200);
          this.eventAggregator.publish("seeds.loading", true);
          waiting = true;
        }
        await this.seed.ensureInitialized();
      }

      await this.hydrateUserData();
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

  links = [
    { name: "twitter", url: "https://twitter.com" },
    { name: "telegram", url: "https://telegram.org/" },
    { name: "discord", url: "https://https://discord.com/" },
    { name: "medium", url: "https://medium.com/" },
    { name: "github", url: "https://github.com" },
    { name: "daotalk", url: "https://daotalk.org/" },
    { name: "website", url: "http://www.douglaskent.com" },
    { name: "pdf", url: "http://www.africau.edu/images/default/sample.pdf" },
    { name: "blob", url: "https://curvelabs.eu" },
  ]

  linkIcons = new Map<string, string>([
    ["twitter", "fab fa-twitter"],
    ["telegram", "fab fa-telegram-plane"],
    ["discord", "fab fa-discord"],
    ["medium", "fab fa-medium-m"],
    ["github", "fab fa-github"],
    ["website", "fa fa-globe-americas"],
    ["misc", "fa fa-external-link-alt"],
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

  buy(): void {
    if (this.userFundingTokenBalance.lt(this.fundingTokenToPay)) {
      this.eventAggregator.publish("handleValidationError", `Your ${this.seed.fundingTokenInfo.symbol} balance is insufficient to cover what you want to pay`);
    } else {
      this.seed.buy(this.fundingTokenToPay);
    }
  }

  claim(): void {
    if (this.userCanClaim) {
      if (this.seed.userClaimableAmount.lt(this.seedTokenToReceive)) {
        this.eventAggregator.publish("handleValidationError", `The amount of ${this.seed.seedTokenInfo.symbol} you are requesting exceeds your claimable amount`);
      } else {
        this.seed.claim();
      }
    }
  }
}
