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
  
  private accountAddress: Address = null;
  private txPhase = Phase.None;
  private txReceipt: TransactionReceipt;

  constructor(
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
    private lbpManagerService: LbpManagerService,
    private router: Router,
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
  }

  async attached(): Promise<void> {
    this.loading = true;
    await this.seedService.ensureAllSeedsInitialized();
    await this.lbpManagerService.ensureAllLbpsInitialized();
    const seed = this.seedService.seeds.get(this.address)
    this.seed = seed;
    this.loading = true;
  }
}

