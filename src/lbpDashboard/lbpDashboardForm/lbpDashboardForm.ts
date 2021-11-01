import { NumberService } from "./../../services/NumberService";
import { ITokenInfo } from "./../../services/TokenTypes";
import { computedFrom, customElement, observable } from "aurelia-framework";
import { LbpManager } from "./../../entities/LbpManager";
import { bindable } from "aurelia-typed-observable-plugin";
import "./lbpDashboardForm.scss";
import { TokenListService } from "services/TokenListService";
import { TokenService } from "services/TokenService";
import { EthereumService, fromWei, Networks, toWei } from "services/EthereumService";
import { BigNumber } from "ethers";
import { DisposableCollection } from "services/DisposableCollection";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { SwapInfo } from "@balancer-labs/sor";
import { BalancerService } from "services/BalancerService";
import TransactionsService, { TransactionResponse } from "services/TransactionsService";

@customElement("lbpdashboardform")
export class lbpDashboardForm {
  @bindable lbpManager: LbpManager;
  fundingTokenInfo: ITokenInfo = {} as unknown as ITokenInfo;
  fundingTokenBalance: BigNumber;
  tokenList: Array<string>;
  @observable fundingTokensToPay: BigNumber;
  subscriptions: DisposableCollection = new DisposableCollection();
  projectTokensToPurchase: BigNumber = BigNumber.from(0);
  sorSwapInfo: SwapInfo;

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
    private transactionsService: TransactionsService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
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

  @computedFrom("lbpManager.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.lbpManager?.userHydrated;
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async hydrateUserData(): Promise<void> {
    this.tokenChanged();
    if (this.ethereumService.defaultAccountAddress) {
    }
  }

  async tokenChanged(): Promise<void> {
    this.fundingTokensToPay = null;
    if (this.ethereumService.defaultAccountAddress && this.fundingTokenInfo.address) {
      const tokenContract = this.tokenService.getTokenContract(this.fundingTokenInfo.address);
      this.fundingTokenBalance = await tokenContract.balanceOf(this.ethereumService.defaultAccountAddress);
    } else {
      this.fundingTokenBalance = null;
    }
  }

  async getProjectTokensToPurchase(): Promise<void> {
    if (this.fundingTokensToPay?.gt(0)) {
      try {
        if (this.fundingTokenInfo.address !== this.lbpManager.fundingTokenAddress) {
          if (this.ethereumService.targetedNetwork !== Networks.Rinkeby) {
            // this.sorSwapInfo =
            // await this.balancerService.getSwapFromSor(
            //   this.fundingTokensToPay,
            //   this.fundingTokenInfo,
            //   this.lbpManager.projectTokenInfo) as SwapInfo;
            // this.projectTokensToPurchase = this.sorSwapInfo.returnAmount;
          }
        } else {
          if (this.fundingTokensToPay?.gt(0)) {
            const projectTokens = this.numberService.fromString(fromWei(this.fundingTokensToPay, this.lbpManager.fundingTokenInfo.decimals).toString())
              * this.lbpManager.projectTokensPerFundingToken;
            this.projectTokensToPurchase = toWei(projectTokens, this.lbpManager.projectTokenInfo.decimals);
          } else {
            this.projectTokensToPurchase = BigNumber.from(0);
          }
          // this won't work without creating an allowance on the fundingToken
          // this.projectTokensToPurchase =
          //   await this.lbpManager.lbp.vault.swap(
          //     this.fundingTokensToPay,
          //     this.fundingTokenInfo.address,
          //     this.lbpManager.projectTokenInfo.address,
          //     true) as BigNumber;
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
    } else {
      this.projectTokensToPurchase = BigNumber.from(0);
    }
  }

  private fundingTokensToPayChanged(): void {
    this.getProjectTokensToPurchase();
  }

  async swap(): Promise<void> {
    // if (await this.validatePaused()) {
    //   return;
    // }

    // if (!this.fundingTokensToPay?.gt(0)) {
    //   this.eventAggregator.publish("handleValidationError", `Please enter the amount of ${this.lbpManager.fundingTokenInfo.symbol} you wish to contribute`);
    // } else if (this.lbpManager.userFundingTokenBalance.lt(this.fundingTokensToPay)) {
    //   this.eventAggregator.publish("handleValidationError", `Your ${this.lbpManager.fundingTokenInfo.symbol} balance is insufficient to cover what you want to pay`);
    // } else if (this.fundingTokensToPay.add(this.lbpManager.amountRaised).gt(this.lbpManager.cap)) {
    //   this.eventAggregator.publish("handleValidationError", `The amount of ${this.lbpManager.fundingTokenInfo.symbol} you wish to contribute will cause the funding maximum to be exceeded`);
    // } else if (this.lockRequired) {
    //   this.eventAggregator.publish("handleValidationError", `Please click UNLOCK to approve the transfer of your ${this.lbpManager.fundingTokenInfo.symbol} to the Seed contract`);
    // } else if (await this.disclaimSeed()) {

    const fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenInfo.address);

    const receipt = await this.transactionsService.send(() => fundingTokenContract.approve(this.lbpManager.lbp.vault.address, this.fundingTokensToPay));

    if (receipt) {
      this.transactionsService.send(() =>
        this.lbpManager.lbp.vault.swap(
          this.fundingTokensToPay,
          this.fundingTokenInfo.address,
          this.lbpManager.projectTokenInfo.address) as Promise<TransactionResponse>);
    }

    //     .then(async (receipt) => {
    //       if (receipt) {
    //         await this.hydrateUserData();
    //         this.congratulationsService.show(`You have contributed ${this.numberService.toString(fromWei(this.fundingTokensToPay, this.lbpManager.fundingTokenInfo.decimals), { thousandSeparated: true })} ${this.lbpManager.fundingTokenInfo.symbol} to ${this.lbpManager.metadata.general.projectName}!`);
    //         this.fundingTokensToPay = null;
    //       }
    //     });
    // }
  }
}
