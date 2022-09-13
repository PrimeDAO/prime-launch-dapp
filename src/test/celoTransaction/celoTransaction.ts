import { autoinject, computedFrom } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { BigNumber, ethers } from "ethers";
import { EthereumService } from "services/EthereumService";
import { DisposableCollection } from "services/DisposableCollection";
import { TokenService } from "services/TokenService";
import TransactionsService from "services/TransactionsService";
import "./celoTransaction.scss";

@autoinject
export class celoTransaction {
  private subscriptions = new DisposableCollection();

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private tokenService: TokenService,
    private transactionService: TransactionsService,
  ) {
  }

  private userFundingTokenBalance: BigNumber;

  private account: string = null;
  private balance: BigNumber = null;
  private checking: boolean = false;
  private tokenAmountToPay: BigNumber = null;
  private addressToPay: string;

  private async initialize() {
    this.account = this.ethereumService.defaultAccountAddress;
    this.getBalance();
  }

  private async getBalance() {
    if (!this.checking) {
      try {
        this.checking = true;
        if (this.account) {
          const provider = this.ethereumService.readOnlyProvider;
          this.balance = await provider.getBalance(this.account);
        } else {
          this.balance = null;
        }
      } catch (ex) {
        console.log("Error", ex.message)
      } finally {
        this.checking = false;
      }
    }
  }

  attached() {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account",
      (account: string) => {
        this.account = account;
        this.getBalance();
      }));
  }

  handleMaxBuy() {
    this.tokenAmountToPay = this.balance ?? BigNumber.from(0);
  }

  async doTransaction() {
    try {
      const provider = this.ethereumService.walletProvider;
      const gasPrice = provider.getGasPrice();
      const signer = this.ethereumService.getDefaultSigner();
      const recipient = this.addressToPay;
      if (!provider || !gasPrice || !signer || !recipient) {
        throw new Error("Missing information. Can't perform transaction.");
      }
      const tx = {
        from: this.account,
        to: recipient,
        value: this.tokenAmountToPay,
        gasPrice,
        gasLimit: ethers.utils.hexlify(21000),
        nonce: provider.getTransactionCount(this.account, "latest")
      }

      const recipt = await signer.sendTransaction(tx);
      console.log({recipt});
    } catch (ex) {
      console.log("Error:", ex.message);
    }
  }
}
