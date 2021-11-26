import { TokenListService } from "services/TokenListService";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import { Address, EthereumService } from "services/EthereumService";
import { autoinject } from "aurelia-dependency-injection";
import { TimingService } from "services/TimingService";

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
    return this.fetchFundingTokenInfos();
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

  private tokenInfos: Array<ITokenInfo>;

  /**
   * inefficient, but only used for testnets
   * @param tokenAddresses
   * @returns
   */
  private async getTokenInfoFromAddresses(tokenAddresses: Array<Address>): Promise<Array<ITokenInfo>> {
    const promises = new Array<Promise<ITokenInfo>>();

    for (const address of tokenAddresses) {
      try {
        const getInfo = async (): Promise<ITokenInfo> => {
          const tokenInfo = await this.tokenService.getTokenInfoFromAddress(address);
          return this.tokenService.getTokenGeckoInfo(tokenInfo);
        };
        promises.push(getInfo());
        // eslint-disable-next-line no-empty
      } catch { }
    }

    return Promise.all(promises);
  }

  public async fetchFundingTokenInfos(): Promise<Array<ITokenInfo>> {

    if (!this.tokenInfos) {

      let tokenInfos: Array<ITokenInfo>;

      TimingService.start("fetchFundingTokenInfos");
      if (EthereumService.targetedNetwork === "mainnet") {
        tokenInfos = await this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments);
      } else {
        tokenInfos = await this.getTokenInfoFromAddresses(this.tokenService.devFundingTokens);
      }

      this.tokenInfos = tokenInfos;
      TimingService.end("fetchFundingTokenInfos");
    }
    return this.tokenInfos;
  }
}
