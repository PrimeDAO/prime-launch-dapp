/* eslint-disable linebreak-style */
import "./seedSale.scss";
import { autoinject, containerless, customElement, singleton } from "aurelia-framework";
import { Address, EthereumService } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { TransactionReceipt } from "services/TransactionsService";

enum Phase {
    None = "None",
    Mining = "Mining",
    Confirming = "Confirming"
}

@autoinject
export class SeedSale {
    subscriptions: DisposableCollection = new DisposableCollection();
    private accountAddress: Address = null;
    private txPhase = Phase.None;
    private txReceipt: TransactionReceipt;

    constructor(
      private ethereumService: EthereumService,
      private eventAggregator: EventAggregator,
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
}

