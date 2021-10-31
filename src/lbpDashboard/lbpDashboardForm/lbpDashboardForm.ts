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
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  attached(): void {
    if (!this.tokenList) {
      if (this.ethereumService.targetedNetwork === "mainnet") {
        const tokenInfos = this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments);
        this.tokenList = tokenInfos.map((tokenInfo: ITokenInfo) => tokenInfo.address);
      } else {
        this.tokenList =
          [
            "0x80E1B5fF7dAdf3FeE78F60D69eF1058FD979ca64",
            "0xc778417E063141139Fce010982780140Aa0cD5Ab",
            "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
            "0x7ba433d48c43e3ceeb2300bfbf21db58eecdcd1a", // USDC having 6 decimals
          ];
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
          // this.sorSwapInfo =
          //   await this.lbpManager.lbp.vault.getSwapFromSor(
          //     this.fundingTokensToPay,
          //     this.fundingTokenInfo,
          //     this.lbpManager.projectTokenInfo) as SwapInfo;
          // this.projectTokensToPurchase = this.sorSwapInfo.returnAmount;
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

    //   await this.lbpManager.lbp.vault.swap(
    //     this.fundingTokensToPay,
    //     this.fundingTokenInfo.address,
    //     this.lbpManager.projectTokenInfo.address) as BigNumber;

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
