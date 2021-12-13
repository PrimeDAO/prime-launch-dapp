import { Router } from "aurelia-router";
import { NumberService } from "./../../services/NumberService";
import { ITokenInfo } from "./../../services/TokenTypes";
import { computedFrom, customElement, observable } from "aurelia-framework";
import { LbpManager } from "./../../entities/LbpManager";
import { bindable } from "aurelia-typed-observable-plugin";
import "./lbpDashboardForm.scss";
import { TokenListService } from "services/TokenListService";
import { TokenService } from "services/TokenService";
import { EthereumService, fromWei } from "services/EthereumService";
import { BigNumber } from "ethers";
import { DisposableCollection } from "services/DisposableCollection";
import { EventAggregator } from "aurelia-event-aggregator";
import { SwapInfo } from "@balancer-labs/sor2";
import { BalancerService } from "services/BalancerService";
import TransactionsService from "services/TransactionsService";
import { CongratulationsService } from "services/CongratulationsService";
import { LaunchService } from "services/LaunchService";
import { Utils } from "services/utils";

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
  subscriptions1: DisposableCollection = new DisposableCollection();
  projectTokensToPurchase: BigNumber = BigNumber.from(0);
  sorSwapInfo: SwapInfo;
  userFundingTokenAllowance: BigNumber;
  balancerReady = false;
  sorSwapInfoChanged = false;
  swapping = false;

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
    /**
     * should be disposed on destruction
     */
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

  private fundingTokensToPayChanged(): void {
    this.refreshFromSorInfo();
  }

  private async refreshFromSorInfo(): Promise<void> {
    this.sorSwapInfo= await this.getProjectTokensPerFundingToken();
    if (this.fundingTokensToPay?.gt(0) && this.projectTokensPerFundingToken) {
      this.projectTokensToPurchase = this.sorSwapInfo.returnAmount;
    } else {
      this.projectTokensToPurchase = BigNumber.from(0);
    }
  }

  private async updateSorState(): Promise<void> {
    if (!this.balancerService.updatingSorState) {
      if (await this.balancerService.updateSorState()) {
        if (this.sorSwapInfo) {
          const oldSorSwapInfo = this.sorSwapInfo;
          await this.refreshFromSorInfo();
          this.sorSwapInfoChanged = !oldSorSwapInfo.returnAmount.eq(this.sorSwapInfo.returnAmount);
          if (this.sorSwapInfoChanged) {
            this.eventAggregator.publish("handleInfo", `Heads up that we just updated the exchange rate for ${this.lbpManager.projectTokenInfo.symbol} that you may receive`);
          }
        } else {
          this.sorSwapInfoChanged = false;
        }
      }
    }
  }

  async attached(): Promise<void> {
    if (!this.tokenList) {
      this.tokenList = await this.launchService.fetchFundingTokenInfos();
    }
    this.balancerReady = await this.balancerService.ensureInitialized();
    if (!this.balancerReady) {
      this.eventAggregator.publish("handleFailure", "Sorry, unable to initialize the swapping form.  Try reentering the page to try again.");
    } else {
      this.subscriptions1.push(this.eventAggregator.subscribe("Network.NewBlock", async () => {
        if (!this.swapping) {
          this.updateSorState();
        }
      }));
    }
  }

  detached(): void {
    this.subscriptions1.dispose();
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
    this.hydrateUserData();
  }

  handleMaxBuy() : void {
    this.fundingTokensToPay = this.userFundingTokenBalance ?? BigNumber.from(0);
  }

  /**
   * side effects: sets this.projectTokensPerFundingToken
   * @returns
   */
  async getProjectTokensPerFundingToken(): Promise<SwapInfo> {

    let sorSwapInfo;

    if (!this.selectedFundingTokenInfo.address || !this.fundingTokensToPay?.gt(0)) {
      this.projectTokensPerFundingToken = null; // will show "--" if displayed by formatted-number
      sorSwapInfo = null;
    }
    else {
      let returnValue: number;

      await Utils.waitUntilTrue(() => !this.balancerService.updatingSorState, 5000);

      sorSwapInfo = await this.balancerService.getSwapFromSor(
        this.fundingTokensToPay,
        this.selectedFundingTokenInfo,
        this.lbpManager.projectTokenInfo) as SwapInfo;

      returnValue = this.numberService.fromString(fromWei(sorSwapInfo.returnAmount, this.lbpManager.projectTokenInfo.decimals).toString());
      returnValue = Number.isFinite(returnValue) ? returnValue : null;
      if (returnValue === 0) {
        returnValue = null;
      }

      this.projectTokensPerFundingToken = returnValue / this.numberService.fromString(fromWei(this.fundingTokensToPay.toString(), this.selectedFundingTokenInfo.decimals));
    }
    return sorSwapInfo;
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

    try {
      this.swapping = true;

      /**
       * don't allow swap if we're in the middle of updating the SOR state
       */
      await Utils.waitUntilTrue(() => !this.balancerService.updatingSorState, 5000);

      /**
       * sorSwapInfoChanged gets set to false in updateSorState, thus making it possible to
       * again to swap.  but note there can potentially be very unstable conditions where the state
       * is fluctuating so much that sorSwapInfoChanged never can get cleared.
       * But that seems unlikely.
       */
      if (this.sorSwapInfo && !this.sorSwapInfoChanged) {
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
          const receipt = await this.transactionsService.send(() => this.balancerService.swapSor(this.sorSwapInfo));
          if (receipt) {
            await this.lbpManager.hydrate();
            this.lbpManager.ensurePriceData(true);
            this.hydrateUserData();

            this.congratulationsService.show(`You have purchased ${this.lbpManager.projectTokenInfo.name} and in doing so have contributed to the ${this.lbpManager.metadata.general.projectName}!`);
            this.fundingTokensToPay = null;
          }
        }
      }
    } finally {
      this.swapping = false;
    }
  }
}
