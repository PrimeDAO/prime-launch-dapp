import { ITokenInfo } from "./../../services/TokenTypes";
import { computedFrom, customElement } from "aurelia-framework";
import { LbpManager } from "./../../entities/LbpManager";
import { bindable } from "aurelia-typed-observable-plugin";
import "./lbpDashboardForm.scss";
import { TokenListService } from "services/TokenListService";
import { TokenService } from "services/TokenService";
import { EthereumService } from "services/EthereumService";
import { BigNumber } from "ethers";
import { DisposableCollection } from "services/DisposableCollection";
import { EventAggregator } from "aurelia-event-aggregator";

@customElement("lbpdashboardform")
export class lbpDashboardForm {
  @bindable lbpManager: LbpManager;
  fundingTokenInfo: ITokenInfo = {} as unknown as ITokenInfo;
  fundingTokenBalance: BigNumber;
  tokenList: Array<string>;
  amountToPay: BigNumber;
  subscriptions: DisposableCollection = new DisposableCollection();

  // @computedFrom("")
  get projectTokensToPurchase(): BigNumber {
    return BigNumber.from(0);
  }

  // @computedFrom("")
  get projectTokensPerFundingToken(): BigNumber {
    return BigNumber.from(0);
  }

  get priceImpact(): number {
    return 0;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private tokenService: TokenService,
    private ethereumService: EthereumService,
    private tokenListService: TokenListService,
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
    if (this.ethereumService.defaultAccountAddress && this.fundingTokenInfo.address) {
      const tokenContract = this.tokenService.getTokenContract(this.fundingTokenInfo.address);
      this.fundingTokenBalance = await tokenContract.balanceOf(this.ethereumService.defaultAccountAddress);
    } else {
      this.fundingTokenBalance = null;
    }
  }
}
