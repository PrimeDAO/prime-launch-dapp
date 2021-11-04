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

@customElement("lbpdashboardform")
export class lbpDashboardForm {
  @bindable lbpManager: LbpManager;
  @bindable disclaimLbp;
  fundingTokenInfo: ITokenInfo = {} as unknown as ITokenInfo;
  userFundingTokenBalance: BigNumber;
  tokenList: Array<string>;
  @observable fundingTokensToPay: BigNumber;
  subscriptions: DisposableCollection = new DisposableCollection();
  projectTokensToPurchase: BigNumber = BigNumber.from(0);
  sorSwapInfo: SwapInfo;
  userFundingTokenAllowance: BigNumber;

  // @computedFrom("amountToPay", "lbpManager.projectTokensPerFundingToken")
  // get projectTokensToPurchase(): BigNumber {
  //   // if (this.amountToPay) {
  //   const projectTokens = this.numberService.fromString(fromWei(this.amountToPay, this.lbpManager.fundingTokenInfo.decimals).toString())
  //   * this.lbpManager.projectTokensPerFundingToken;

  //   return toWei(projectTokens, this.lbpManager.projectTokenInfo.decimals);
  // } else {
  //   return BigNumber.from(0);
  // }
  // }

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
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("userFundingTokenBalance", "fundingTokensToPay")
  get userCanPay(): boolean { return this.userFundingTokenBalance?.gt(this.fundingTokensToPay ?? "0"); }

  @computedFrom("userFundingTokenAllowance", "fundingTokensToPay")
  get lockRequired(): boolean {
    return this.userFundingTokenAllowance?.lt(this.fundingTokensToPay ?? "0");
  }

  @computedFrom("lbpManager.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.lbpManager?.userHydrated;
  }

  private fundingTokensToPayChanged(): void {
    this.getProjectTokensToPurchase();
  }

  async attached(): Promise<void> {
    await this.balancerService.ensureInitialized();
    if (!this.tokenList) {
      if (this.ethereumService.targetedNetwork === "mainnet") {
        const tokenInfos = this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments);
        this.tokenList = tokenInfos.map((tokenInfo: ITokenInfo) => tokenInfo.address);
      } else {
        this.tokenList = this.tokenService.devFundingTokens;
      }
    }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async hydrateUserData(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress && this.fundingTokenInfo.address) {
      const tokenContract = this.tokenService.getTokenContract(this.fundingTokenInfo.address);
      this.userFundingTokenBalance = await tokenContract.balanceOf(this.ethereumService.defaultAccountAddress);
      this.userFundingTokenAllowance = await tokenContract.allowance(this.ethereumService.defaultAccountAddress, this.lbpManager.lbp.vault.address);
    } else {
      this.userFundingTokenAllowance = null;
      this.userFundingTokenBalance = null;
    }
  }

  async tokenChanged(): Promise<void> {
    this.fundingTokensToPay = null;
    this.hydrateUserData();
  }

  handleMaxBuy() : void {
    this.fundingTokensToPay = this.userFundingTokenBalance ?? BigNumber.from(0);
  }

  async getProjectTokensToPurchase(): Promise<void> {
    if (this.fundingTokensToPay?.gt(0)) {
      try {
        if (this.fundingTokenInfo.address !== this.lbpManager.fundingTokenAddress) {
          this.sorSwapInfo =
            await this.balancerService.getSwapFromSor(
              this.fundingTokensToPay,
              this.fundingTokenInfo,
              this.lbpManager.projectTokenInfo) as SwapInfo;
          this.projectTokensToPurchase = this.sorSwapInfo.returnAmount;
        } else {
          this.sorSwapInfo= null;
          if (this.fundingTokensToPay?.gt(0)) {
            const projectTokens = this.numberService.fromString(fromWei(this.fundingTokensToPay, this.lbpManager.fundingTokenInfo.decimals).toString())
              * this.lbpManager.projectTokensPerFundingToken;
            this.projectTokensToPurchase = toWei(projectTokens, this.lbpManager.projectTokenInfo.decimals);
          } else {
            this.projectTokensToPurchase = BigNumber.from(0);
          }
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
    } else {
      this.projectTokensToPurchase = BigNumber.from(0);
    }
  }

  async validatePaused(): Promise<boolean> {
    const paused = await this.lbpManager.hydatePaused();
    if (paused) {
      this.eventAggregator.publish("handleValidationError", "Sorry, this LBP has been paused");
      this.router.navigate("/home");
      return true;
    } else {
      return false;
    }
  }

  async unlockFundingTokens(): Promise<void> {
    if (await this.validatePaused()) {
      return;
    }

    if (await this.disclaimLbp()) {
      this.lbpManager.unlockFundingTokens(this.fundingTokensToPay)
        .then((receipt) => {
          if (receipt) {
            this.hydrateUserData();
          }
        });
    }
  }

  async swap(): Promise<void> {
    if (await this.validatePaused()) {
      return;
    }

    if (!this.fundingTokensToPay?.gt(0)) {
      this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.fundingTokenInfo.symbol} you wish to contribute`);
    } else if (!this.projectTokensToPurchase?.gt(0)) {
      this.eventAggregator.publish("handleValidationError", `No ${this.lbpManager.projectTokenInfo.symbol} are expected to be returned in this swap`);
    } else if (this.userFundingTokenBalance.lt(this.fundingTokensToPay)) {
      this.eventAggregator.publish("handleValidationError", `Your ${this.fundingTokenInfo.symbol} balance is insufficient to cover what you want to pay`);
    } else if (this.lockRequired) {
      this.eventAggregator.publish("handleValidationError", `Please click UNLOCK to approve the transfer of your ${this.fundingTokenInfo.symbol} to the LbpManager contract`);
    }
    else if (await this.disclaimLbp()) {

      let promise: Promise<TransactionReceipt>;

      if (this.fundingTokenInfo.address !== this.lbpManager.fundingTokenAddress) {
        if (this.sorSwapInfo) {
          promise = this.transactionsService.send(() => this.balancerService.swapSor(this.sorSwapInfo));
        }
      } else {
        promise = this.transactionsService.send(() =>
          this.lbpManager.lbp.vault.swap(
            this.fundingTokensToPay,
            this.fundingTokenInfo.address,
            this.lbpManager.projectTokenInfo.address) as Promise<TransactionResponse>);
      }

      promise.then(async (receipt) => {
        if (receipt) {
          await this.hydrateUserData();
          this.congratulationsService.show(`You have purchased ${this.lbpManager.projectTokenInfo.name} and in doing so have contributed to the ${this.lbpManager.metadata.general.projectName}!`);
          this.fundingTokensToPay = null;
        }
      });
    }
  }
}
