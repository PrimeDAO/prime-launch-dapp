import { ITokenInfo, TokenService } from "services/TokenService";
/* eslint-disable linebreak-style */
import "./seedSale.scss";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Seed } from "entities/Seed";
import { Address, EthereumService } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { TransactionReceipt } from "services/TransactionsService";
import { SeedService } from "services/SeedService";
import { LbpManagerService } from "services/LbpManagerService";
import { CongratulationsService } from "services/CongratulationsService";
import { Utils } from "services/utils";
import { EventConfigException } from "services/GeneralEvents";
import { GeoBlockService } from "services/GeoBlockService";
import { BigNumber } from "ethers";
import { DateService } from "services/DateService";

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
  percentsRaised: number
  timeLeft: string
  fundingTokenInfo: ITokenInfo;
  projectTokenInfo: ITokenInfo;

  private accountAddress: Address = null;
  private txPhase = Phase.None;
  private txReceipt: TransactionReceipt;

  constructor(
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private lbpManagerService: LbpManagerService,
    private router: Router,
    private congratulationsService: CongratulationsService,
    private geoBlockService: GeoBlockService,
    private dateService: DateService,
    private tokenService: TokenService,
  ){
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
      this.accountAddress = account;
      this.txPhase = Phase.None;
      this.txReceipt = null;
    }));
  }

  async getTimeLeft(): Promise<void> {
    let ms = -1 * this.seed.startsInMilliseconds;
    const days = ms>86400000 ? Math.floor(ms / 86400000) : 0;
    ms = ms>86400000 ? ms % 86400000 : ms;
    const hrs = ms>3600000 ? Math.floor(ms / 3600000) : 0;
    ms = ms>3600000 ? ms % 3600000 : ms;
    const mins = ms>60000 ? Math.floor(ms / 60000) : 0;
    const result = `${days}d${days > 1 ? "s" : ""}, ${hrs}h, ${mins}m`;
    this.timeLeft = result;
  }

  async getPercentOfRaised():Promise<void> {
    const percent = Math.floor(this.seed.target.toNumber() / 100);
    const percentsRaised = Math.floor(this.seed.amountRaised.toNumber() / percent);
    this.percentsRaised = percentsRaised;
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
  }

  async show1(): Promise<void> {
    await Utils.waitUntilTrue(() => true, 5000);
    this.congratulationsService.show("it's works!");
  }

  async show2(): Promise<void> {
    await Utils.waitUntilTrue(() => true, 5000);
    this.congratulationsService.show("it's works!");
  }

  async show3(): Promise<void> {
    await Utils.waitUntilTrue(() => true, 5000);
    this.congratulationsService.show("it's works!");
  }

  async attached(): Promise<void> {
    let waiting = false;
    this.loading = true;

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
      this.getPercentOfRaised();
      this.getTimeLeft();
      this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.seed.fundingTokenAddress);
      this.projectTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.seed.projectTokenAddress);
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
}

