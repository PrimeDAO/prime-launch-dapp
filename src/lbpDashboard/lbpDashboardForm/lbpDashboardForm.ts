import { TransactionReceipt } from "@ethersproject/providers";
import { Router } from "aurelia-router";
import { NumberService } from "./../../services/NumberService";
import { ITokenInfo } from "./../../services/TokenTypes";
import { computedFrom, customElement, observable } from "aurelia-framework";
import { LbpManager } from "./../../entities/LbpManager";
import { bindable } from "aurelia-typed-observable-plugin";
import "./lbpDashboardForm.scss";
import { TokenListService } from "services/TokenListService";
import { TokenService } from "services/TokenService";
import { EthereumService, fromWei, toWei } from "services/EthereumService";
import { BigNumber } from "ethers";
import { DisposableCollection } from "services/DisposableCollection";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { SwapInfo } from "@balancer-labs/sor";
import { BalancerService } from "services/BalancerService";
import TransactionsService, { TransactionResponse } from "services/TransactionsService";
import { CongratulationsService } from "services/CongratulationsService";
import { LaunchService } from "services/LaunchService";

@customElement("lbpdashboardform")
export class lbpDashboardForm {
  @bindable lbpManager: LbpManager;
  @bindable disclaimLbp;
  selectedFundingTokenInfo: ITokenInfo = {} as unknown as ITokenInfo;
  userFundingTokenBalance: BigNumber;
  projectTokensPerFundingToken: number;
  tokenList: Array<ITokenInfo>;
  @observable fundingTokensToPay: BigNumber;
  subscriptions: DisposableCollection = new DisposableCollection();
  projectTokensToPurchase: BigNumber = BigNumber.from(0);
  sorSwapInfo: SwapInfo;
  userFundingTokenAllowance: BigNumber;

  get priceImpact(): number {
    return 0;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private tokenService: TokenService,
    private ethereumService: EthereumService,
    private tokenListService: TokenListService,
    private numberService: NumberService,
    private balancerService: BalancerService,
    private router: Router,
    private transactionsService: TransactionsService,
    private congratulationsService: CongratulationsService,
    private launchService: LaunchService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("userFundingTokenBalance", "fundingTokensToPay")
  get userCanPay(): boolean { return this.userFundingTokenBalance?.gte(this.fundingTokensToPay ?? "0"); }

  @computedFrom("userFundingTokenAllowance", "fundingTokensToPay")
  get lockRequired(): boolean {
    return this.userFundingTokenAllowance?.lt(this.fundingTokensToPay ?? "0");
  }

  @computedFrom("lbpManager.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.lbpManager?.userHydrated;
  }

  private async fundingTokensToPayChanged(): Promise<void> {
    this.getProjectTokensToPurchase();
  }

  async attached(): Promise<void> {
    await this.balancerService.ensureInitialized();
    if (!this.tokenList) {
      this.tokenList = await this.launchService.getFundingTokenInfos();
    }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress && this.selectedFundingTokenInfo.address) {
      const tokenContract = this.tokenService.getTokenContract(this.selectedFundingTokenInfo.address);
      this.userFundingTokenBalance = await tokenContract.balanceOf(this.ethereumService.defaultAccountAddress);
      this.userFundingTokenAllowance = await this.lbpManager.getFundingTokenAllowance(this.selectedFundingTokenInfo.address);
    } else {
      this.userFundingTokenAllowance = null;
      this.userFundingTokenBalance = null;
    }
  }

  private async handleTokenChanged(): Promise<void> {
    this.fundingTokensToPay = null;
    await this.getProjectTokensPerFundingToken();
    this.hydrateUserData();
  }

  handleMaxBuy() : void {
    this.fundingTokensToPay = this.userFundingTokenBalance ?? BigNumber.from(0);
  }

  /**
   * side effects: sets this.projectTokensPerFundingToken
   * @returns
   */
  async getProjectTokensPerFundingToken(): Promise<void> {
    let returnValue: number;

    if (!this.selectedFundingTokenInfo.address) {
      returnValue = null; // will show "--" if displayed by formatted-number
    }
    else if (this.selectedFundingTokenInfo.address !== this.lbpManager.fundingTokenAddress) {

      const sorSwapInfo = await this.balancerService.getSwapFromSor(
        toWei(BigNumber.from(1), this.selectedFundingTokenInfo.decimals),
        this.selectedFundingTokenInfo,
        this.lbpManager.projectTokenInfo) as SwapInfo;

      returnValue = this.numberService.fromString(fromWei(sorSwapInfo.returnAmount, this.lbpManager.projectTokenInfo.decimals).toString());
      returnValue = Number.isFinite(returnValue) ? returnValue : null;
      if (returnValue === 0) {
        returnValue = null; // will show "--" if displayed by formatted-number
      }

    } else { // using the pool funding token
      // using this instead of SOR because it may give a more up-to-date number since doesn't rely on the subgraph
      returnValue = this.lbpManager.getCurrentExchangeRate();
    }

    this.projectTokensPerFundingToken = returnValue;
  }

  async getProjectTokensToPurchase(): Promise<void> {
    if (this.fundingTokensToPay?.gt(0) && this.projectTokensPerFundingToken) {
      try {
        if (this.selectedFundingTokenInfo.address !== this.lbpManager.fundingTokenAddress) {

          this.sorSwapInfo = await this.balancerService.getSwapFromSor(
            this.fundingTokensToPay,
            this.selectedFundingTokenInfo,
            this.lbpManager.projectTokenInfo) as SwapInfo;

          this.projectTokensToPurchase = this.sorSwapInfo.returnAmount;

        } else { // using the pool funding token

          this.sorSwapInfo= null;

          this.projectTokensToPurchase = toWei(this.numberService.fromString(fromWei(this.fundingTokensToPay, this.selectedFundingTokenInfo.decimals).toString()) * this.projectTokensPerFundingToken, this.lbpManager.projectTokenInfo.decimals);
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
    } else {
      this.projectTokensToPurchase = BigNumber.from(0);
    }
  }

  async validateEndedOrPaused(): Promise<boolean> {
    const paused = await this.lbpManager.hydratePaused();
    if (paused) {
      this.eventAggregator.publish("handleValidationError", "Sorry, swapping in this liquid launch has been paused by the launch administrator.");
      return true;
    } else if (this.lbpManager.isDead) {
      this.eventAggregator.publish("handleValidationError", "Sorry, this liquid launch has ended.");
      return true;
    } else {
      return false;
    }
  }

  async unlockFundingTokens(): Promise<void> {
    if (await this.validateEndedOrPaused()) {
      return;
    }

    if (await this.disclaimLbp()) {
      this.lbpManager.allowFundingTokens(this.selectedFundingTokenInfo.address, this.fundingTokensToPay)
        .then((receipt) => {
          if (receipt) {
            this.hydrateUserData();
          }
        });
    }
  }

  async swap(): Promise<void> {
    if (await this.validateEndedOrPaused()) {
      return;
    }

    if (!this.fundingTokensToPay?.gt(0)) {
      this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.selectedFundingTokenInfo.symbol} you wish to contribute`);
    } else if (!this.projectTokensToPurchase?.gt(0)) {
      this.eventAggregator.publish("handleValidationError", `No ${this.lbpManager.projectTokenInfo.symbol} are expected to be returned in this swap`);
    } else if (this.userFundingTokenBalance.lt(this.fundingTokensToPay)) {
      this.eventAggregator.publish("handleValidationError", `Your ${this.selectedFundingTokenInfo.symbol} balance is insufficient to cover what you want to pay`);
    } else if (this.lockRequired) {
      this.eventAggregator.publish("handleValidationError", `Please click UNLOCK to approve the transfer of your ${this.selectedFundingTokenInfo.symbol} to the LbpManager contract`);
    }
    else if (await this.disclaimLbp()) {

      let promise: Promise<TransactionReceipt>;

      if (this.selectedFundingTokenInfo.address !== this.lbpManager.fundingTokenAddress) {
        if (this.sorSwapInfo) {
          promise = this.transactionsService.send(() => this.balancerService.swapSor(this.sorSwapInfo));
        }
      } else {
        promise = this.transactionsService.send(() =>
          this.lbpManager.lbp.vault.swap(
            this.fundingTokensToPay,
            this.selectedFundingTokenInfo.address,
            this.lbpManager.projectTokenInfo.address) as Promise<TransactionResponse>);
      }

      promise.then(async (receipt) => {
        if (receipt) {
          await this.hydrateUserData();
          this.lbpManager.ensurePriceHistory(true);

          this.congratulationsService.show(`You have purchased ${this.lbpManager.projectTokenInfo.name} and in doing so have contributed to the ${this.lbpManager.metadata.general.projectName}!`);
          this.fundingTokensToPay = null;
        }
      });
    }
  }
}
