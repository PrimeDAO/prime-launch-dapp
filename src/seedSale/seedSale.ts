/* eslint-disable linebreak-style */
import "./seedSale.scss";
import { autoinject, containerless, customElement, singleton } from "aurelia-framework";
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
  geoBlocked: boolean;
  userFundingTokenAllowance: BigNumber;
  
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
  ){
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async (account: Address) => {
    this.accountAddress = account;
    this.txPhase = Phase.None;
    this.txReceipt = null;
    }));
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
    this.geoBlocked = this.geoBlockService.blackisted;
  }

  async show1(): Promise<void> {
    await Utils.waitUntilTrue(() => true, 5000);
    this.congratulationsService.show(`it's works!`);
  }

  async show2(): Promise<void> {
    await Utils.waitUntilTrue(() => true, 5000);
    this.congratulationsService.show(`it's works!`);
  }

  async show3(): Promise<void> {
    await Utils.waitUntilTrue(() => true, 5000);
    this.congratulationsService.show(`it's works!`);
  }

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      this.userFundingTokenAllowance = await this.seed.fundingTokenAllowance();
    }
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
      console.log('THIS SEED', this.seed)
    }
  }
}

