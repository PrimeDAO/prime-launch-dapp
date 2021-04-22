import { DisposableCollection } from "./../services/DisposableCollection";
import { EthereumService, fromWei, toWei } from "./../services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import { bindable } from "aurelia-typed-observable-plugin";
import { Address } from "services/EthereumService";
import "./seedDashboard.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";
import { EventConfigException } from "services/GeneralEvents";
import { EventAggregator } from "aurelia-event-aggregator";
import { BigNumber } from "ethers";
import { NumberService } from "services/numberService";

@autoinject
export class SeedDashboard {
  @bindable address: Address;

  subscriptions: DisposableCollection = new DisposableCollection();

  seed: Seed;
  loading = true;
  seedTokenToReceive = 1;
  fundingTokenToPay: BigNumber;
  seedTokenToPay: BigNumber;

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

  @computedFrom("seedTokenReward", "seed.seedTokenInfo.price")
  get seedTokenRewardPrice(): number { return this.seedTokenReward * this.seed?.seedTokenInfo.price; }

  @computedFrom("fundingTokenToPay", "seed.price")
  get seedTokenReward(): number {return (this.numberService.fromString(fromWei(this.fundingTokenToPay ?? "0"))) * this.seed?.price; }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
  }

  attached(): Promise<void> {
    return this.load();
  }

  async load(): Promise<void> {
    try {
      let waiting = false;
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
        }
        await this.seed.ensureInitialized();
      }
      await this.hydrateUserData();
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("seeds.loading", false);
      this.loading = false;
    }
  }

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
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

  claim(): void {
    if (this.userCanClaim) {

    }
  }
}
