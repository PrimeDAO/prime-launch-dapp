import { TokenListService } from "services/TokenListService";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import { Address, EthereumService } from "services/EthereumService";
import { autoinject } from "aurelia-dependency-injection";

@autoinject
export class LaunchService {

  constructor(
    private ethereumService: EthereumService,
    private tokenService: TokenService,
    private tokenListService: TokenListService,
  ) {

  }

  public initialize(): Promise<any> {
    /**
     * we know we need these in several places.  Load them in advance.
     */
    return this.getFundingTokenInfos();
  }

  linkIcons = new Map<string, string>([
    ["twitter", "fab fa-twitter"],
    ["telegram", "fab fa-telegram-plane"],
    ["discord", "fab fa-discord"],
    ["youtube", "fab fa-youtube"],
    ["medium", "fab fa-medium-m"],
    ["github", "fab fa-github"],
    ["website", "fa fa-globe-americas"],
    ["misc", "fa fa-external-link-alt"],
    ["home", "fas fa-home"],
    ["pdf", "fas fa-file-pdf"],
  ]);

  formatLink(link: string): string {
    const pattern = /^(?:http(s)?:\/\/)/i;
    if (!pattern.test(link)) {
      return "//" + link;
    }
  }

  iconClassForLinkType(type: string): string {
    return this.linkIcons.get(type.toLowerCase()) ?? this.linkIcons.get("misc");
  }

  public async getFundingTokenInfos(): Promise<Array<ITokenInfo>> {
    let tokenAddresses: Array<Address>;
    if (this.ethereumService.targetedNetwork === "mainnet") {
      /**
       * Though we have tokenInfos already fetched from this tokenList, they don't have prices yet,
       * so we have to call `tokenService.getTokenInfoFromAddresses` to get the prices.
       */
      tokenAddresses = this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments)
        .map((tokenInfo) => tokenInfo.address);
    } else {
      tokenAddresses = this.tokenService.devFundingTokens;
    }
    return this.tokenService.getTokenInfoFromAddresses(tokenAddresses);
  }
}
