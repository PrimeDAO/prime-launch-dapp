import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless } from "aurelia-framework";
import { BigNumber } from "ethers";
import { ContractNames, ContractsService } from "services/ContractsService";
import { DisposableCollection } from "services/DisposableCollection";
import { EthereumService } from "services/EthereumService";
import { EventConfigFailure } from "services/GeneralEvents";
import TransactionsService from "services/TransactionsService";

@autoinject
@containerless
export class WethEthExchange {
  private ethWethAmount: BigNumber;
  private wethEthAmount: BigNumber;
  private userEthBalance: BigNumber;
  private userWethBalance: BigNumber;
  private weth;
  private subscriptions = new DisposableCollection();

  constructor(
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private transactionsService: TransactionsService,
    private contractsService: ContractsService,
  ) {
  }

  async attached(): Promise<void> {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed",
      async () => {
        this.loadContracts();
      }));

    this.eventAggregator.subscribe("Network.Changed.Account", async () => {
      this.getUserBalances();
    });

    // this.subscriptions.push(this.eventAggregator.subscribe("Network.NewBlock",
    // () => this.getBalance()));

    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Disconnect", async () => {
      this.loadContracts();
    }));

    await this.loadContracts();
    this.getUserBalances();
  }

  detached(): void {
    this.subscriptions.dispose();
  }

  async loadContracts(): Promise<void> {
    this.weth = await this.contractsService.getContractFor(ContractNames.WETH);
  }

  async getUserBalances(): Promise<void> {
    const provider = this.ethereumService.readOnlyProvider;
    this.userWethBalance = await this.weth.balanceOf(this.ethereumService.defaultAccountAddress);
    this.userEthBalance = await provider.getBalance(this.ethereumService.defaultAccountAddress);
  }

  private async handleDeposit() {
    if (this.ethereumService.ensureConnected()) {
      if (!this.ethWethAmount || this.ethWethAmount.eq(0)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("Enter a value for ETH"));
      }
      else if (this.ethWethAmount.gt(this.userEthBalance)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough ETH to wrap the amount you requested"));
      } else {
        await this.transactionsService.send(() => this.weth.deposit({ value: this.ethWethAmount }));
        this.getUserBalances();
        this.eventAggregator.publish("ethWethExchanged");
      }
    }
  }

  private async handleWithdraw() {
    if (this.ethereumService.ensureConnected()) {
      if (!this.wethEthAmount || this.wethEthAmount.eq(0)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("Enter a value for WETH"));
      }
      else if (this.wethEthAmount.gt(this.userWethBalance)) {
        this.eventAggregator.publish("handleValidationError", new EventConfigFailure("You don't have enough WETH to unwrap the amount you requested"));
      } else {
        await this.transactionsService.send(() => this.weth.withdraw(this.wethEthAmount));
        this.getUserBalances();
        this.eventAggregator.publish("ethWethExchanged");
      }
    }
  }

  private handleGetMaxWeth() {
    this.wethEthAmount = this.userWethBalance;
  }

  private handleGetMaxEth() {
    this.ethWethAmount = this.userEthBalance;
  }
}
