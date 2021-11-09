import { TokenListService } from "services/TokenListService";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import { EthereumService } from "services/EthereumService";
import { autoinject } from "aurelia-dependency-injection";

@autoinject
export class LaunchService {

  constructor(
    private ethereumService: EthereumService,
    private tokenService: TokenService,
    private tokenListService: TokenListService,
  ) {

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
    let tokenInfos: Array<ITokenInfo>;
    if (this.ethereumService.targetedNetwork === "mainnet") {
      tokenInfos = this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments);
    } else {
      tokenInfos = await this.tokenService.getTokenInfoFromAddresses(this.tokenService.devFundingTokens);
    }
    return tokenInfos;
  }
}
