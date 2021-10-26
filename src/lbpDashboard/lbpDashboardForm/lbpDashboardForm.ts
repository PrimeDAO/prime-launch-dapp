import { ITokenInfo } from "./../../services/TokenTypes";
import { customElement } from "aurelia-framework";
import { LbpManager } from "./../../entities/LbpManager";
import { bindable } from "aurelia-typed-observable-plugin";
import "./lbpDashboardForm.scss";
import { TokenListService } from "services/TokenListService";
import { TokenService } from "services/TokenService";
import { EthereumService } from "services/EthereumService";

@customElement("lbpdashboardform")
export class lbpDashboardForm {
  @bindable lbpManager: LbpManager;

  fundingTokenInfo: ITokenInfo;
  tokenList: Array<string>;

  constructor(
    private tokenService: TokenService,
    private ethereumService: EthereumService,
    private tokenListService: TokenListService,
  ) {

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
}
