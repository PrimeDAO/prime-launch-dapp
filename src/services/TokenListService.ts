import { autoinject } from "aurelia-framework";
import { IpfsService } from "./IpfsService";
import { EthereumService } from "services/EthereumService";
import axios from "axios";
import { TOKEN_LIST_MAP } from "configurations/tokenLists";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ITokenInfo } from "services/TokenTypes";

interface ITokenListUris {
  All: string[];
  PrimeDao: {
    All: string[];
    Payments: string;
  };
  // Balancer: {
  //   All: string[];
  //   // Compliant list for exchange
  //   Default: string;
  //   // Extended list to include LBP tokens
  //   Vetted: string;
  // };
  // Approved: string[];
  // External: string[];
}

export interface IVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface ITokenList {
  readonly name: string;
  readonly timestamp: string;
  readonly version: IVersion;
  readonly tokens: ITokenInfo[];
  readonly keywords?: string[];
}

/**
 * Object of token lists key'd by the uri from which they originated
 */
export type TokenListMap = { [uri: string]: ITokenList };

@autoinject
export class TokenListService {

  constructor(
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
    private consoleLogService: ConsoleLogService,
  ) {
  }

  /**
   * Return all token list URIs for the app network in
   * a structured object.
   */
  public get tokenLists(): ITokenListUris {
    const { PrimeDao /*, Balancer, External */ } = TOKEN_LIST_MAP[this.ethereumService.targetedNetwork];

    const primeDaoLists = [PrimeDao.Payments];
    // const balancerLists = [Balancer.Default, Balancer.Vetted];
    const All = [...primeDaoLists /*, ...balancerLists, ...External*/];
    // const Approved = [Balancer.Default, ...External];

    return {
      All,
      PrimeDao: {
        All: primeDaoLists,
        ...PrimeDao,
      },
      // Balancer: {
      //   All: balancerLists,
      //   ...Balancer,
      // },
      // Approved,
      // External,
    };
  }

  private async fetch(uri: string): Promise<ITokenList> {
    try {
      if (uri) {
        const [protocol, path] = uri.split("://");

        if (uri.endsWith(".eth")) {
          return await this.getByEns(uri);
        } else if (protocol === "https") {
          const { data } = await axios.get<ITokenList>(uri);
          return data;
        } else if (protocol === "ipns") {
          return await this.ipfsService.getObjectFromHash(path, protocol);
        } else {
          this.consoleLogService.logMessage(`Unhandled TokenList protocol: ${uri}`);
          throw new Error("Unhandled TokenList protocol");
        }
      } else {
        return {
          name: null,
          timestamp: null,
          version: null,
          tokens: [],
        };
      }
    } catch (error) {
      this.consoleLogService.logMessage(`Failed to load TokenList: ${uri} error`);
      this.consoleLogService.logMessage(`${error?.message}`);
      throw error;
    }
  }

  private async getByEns(ensName: string): Promise<ITokenList> {
    const resolver = await this.ethereumService.readOnlyProvider.getResolver(ensName);
    const [, ipfsHash] = (await resolver.getContentHash()).split("://");
    return await this.ipfsService.getObjectFromHash(ipfsHash);
  }

  /**
   * Return an object having each key as the Uri to a canonical TokenList.
   * The keys, when enumerated, will appear in the order in which they
   * appear in `urls` or `this.uris.All`.
   */
  public async fetchLists(urls?: Array<string>): Promise<TokenListMap> {
    const uris = urls ?? this.tokenLists.All;
    /**
     * each call to `fetch` fetches a list
     */
    const allFetchPromises = uris.map(uri => this.fetch(uri));
    const lists = await Promise.all(
      allFetchPromises.map(fetchList => fetchList.catch(e => e)),
    );
    const listsWithKey = lists.map((list, i) => [uris[i], list]);
    const validLists = listsWithKey.filter(list => !(list[1] instanceof Error));

    if (validLists.length === 0) {
      throw new Error("Failed to load any TokenLists");
    } else if (lists[0] instanceof Error) {
      throw new Error("Failed to load default TokenList");
    }
    for (const list of validLists) {
      const tokenInfos = list[1]?.tokens;
      if (tokenInfos) {
        list[1].tokens = tokenInfos.filter((tokenInfo: ITokenInfo) => tokenInfo["chainId"] === this.ethereumService.targetedChainId);
      }
    }
    return Object.fromEntries(validLists);
  }
}
