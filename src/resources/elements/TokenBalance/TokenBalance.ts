import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, containerless, customElement, bindable } from "aurelia-framework";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { IErc20Token, TokenService } from "services/TokenService";

@autoinject
@containerless
@customElement("tokenbalance")
export class TokenBalance {
  @bindable public tokenAddress: Address;
  @bindable public placement = "top";
  @bindable public formatted;

  private balance: BigNumber = null;
  private subscriptions = new DisposableCollection();
  private checking = false;
  private account: string;
  private contract: IErc20Token;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private tokenService: TokenService) {
  }

  public attached(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account",
      (account: string) => {
        this.account = account;
        this.getBalance();
      }));
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Id",
      () => { this.initialize(); }));
    this.subscriptions.push(this.eventAggregator.subscribe("Network.NewBlock",
      () => this.getBalance()));
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.account = this.ethereumService.defaultAccountAddress;

    this.contract = this.tokenService.getTokenContract(this.tokenAddress);
    this.getBalance();
  }

  private detached(): void {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
  }

  private async getBalance() {
    if (!this.checking) {
      try {
        this.checking = true;
        if (this.account) {
          this.balance = await this.contract.balanceOf(this.account);
        } else {
          this.balance = null;
        }
        // tslint:disable-next-line:no-empty
        // eslint-disable-next-line no-empty
      } catch (ex) {
      } finally {
        this.checking = false;
      }
    }
  }
}
