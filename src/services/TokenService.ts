import { autoinject } from "aurelia-framework";
import { BigNumber, Contract, ethers } from "ethers";
import axios from "axios";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService, Networks } from "services/EthereumService";
import { ConsoleLogService } from "services/ConsoleLogService";
import { toBigNumberJs } from "services/BigNumberService";
import { from, Subject } from "rxjs";
import { concatMap } from "rxjs/operators";
import { IErc20Token, ITokenHolder, ITokenInfo } from "services/TokenTypes";
import { TokenListMap, TokenListService } from "services/TokenListService";
import TokenMetadataService from "services/TokenMetadataService";

@autoinject
export class TokenService {

  erc20Abi: any;
  tokenInfos = new Map<Address, ITokenInfo>();
  queue: Subject<() => Promise<void>>;
  tokenLists: TokenListMap;

  constructor(
    private ethereumService: EthereumService,
    private consoleLogService: ConsoleLogService,
    private contractsService: ContractsService,
    private tokenListService: TokenListService,
    private tokenMetadataService: TokenMetadataService) {
    this.erc20Abi = contractsService.getContractAbi(ContractNames.ERC20);
    this.queue = new Subject<() => Promise<void>>();
    // this will initiate the execution of the promises
    // each promise is executed after the previous one has resolved
    this.queue.pipe(concatMap((resolver: () => Promise<void>) => {
      return from(resolver());
    }))
      .subscribe();
  }

  async initialize(): Promise<TokenListMap> {
    return this.tokenLists = await this.tokenListService.fetchLists();
  }

  private getEthplorerUrl(api: string) {
    // note ethplorer only works on mainnet and kovan
    return `https://${this.ethereumService.targetedNetwork === Networks.Mainnet ? "" : `${this.ethereumService.targetedNetwork}-`}api.ethplorer.io/${api}?apiKey=${process.env.ETHPLORER_KEY}`;
  }

  private async _getTokenInfoFromAddress(tokenAddress: Address,
    resolve: (tokenInfo: ITokenInfo) => void,
    _rejector: (reason?: any) => void): Promise<void> {

    let tokenInfo = this.tokenInfos.get(tokenAddress.toLowerCase());

    if (!tokenInfo) {
      // are these defaults ever actually used anymore?
      // eslint-disable-next-line require-atomic-updates
      tokenInfo = {
        address: tokenAddress,
        id: "",
        price: 0,
        decimals: 18,
      } as unknown as ITokenInfo;

      if (["mainnet", "rinkeby"].includes(this.ethereumService.targetedNetwork)) {
        const tokenInfoMap = await this.tokenMetadataService.fetchTokenMetadata([tokenAddress], this.tokenLists);
        // eslint-disable-next-line require-atomic-updates
        tokenInfo = tokenInfoMap[tokenAddress];
        // eslint-disable-next-line require-atomic-updates
        tokenInfo.id = await this.getTokenGeckoId(tokenInfo.name, tokenInfo.symbol);
        this.consoleLogService.logMessage(`loaded token: ${tokenAddress}`, "info");
      }

      this.tokenInfos.set(tokenAddress.toLowerCase(), tokenInfo);

      if (tokenInfo.id) {
        const uri = `https://api.coingecko.com/api/v3/coins/${tokenInfo.id}?market_data=true&localization=false&community_data=false&developer_data=false&sparkline=false`;

        await axios.get(uri)
          .then((response) => {
            tokenInfo.price = response.data.market_data.current_price.usd ?? 0;
            if (!tokenInfo.logoURI) {
              tokenInfo.logoURI = response.data.image.thumb;
            }
          })
          .catch((error) => {
            this.consoleLogService.logMessage(`PriceService: Error fetching token price ${error?.message}`, "error");
          });
      }

      if (!tokenInfo.logoURI) {
        tokenInfo.logoURI = "/genericToken.svg";
      }
      if (!tokenInfo.symbol) {
        tokenInfo.symbol = tokenInfo.name = "N/A";
      }

    }

    resolve(tokenInfo);
  }

  public async getTokenInfoFromAddress(tokenAddress: Address): Promise<ITokenInfo> {

    let resolver: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void;
    let rejector: (reason?: any) => void;

    const promise = new Promise<ITokenInfo>((
      resolve: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void,
      reject: (reason?: any) => void,
    ): void => {
      resolver = resolve;
      rejector = reject;
    });

    /**
     * Fetch tokens one-at-a-time because many requests will be redundant, we want them
     * to take advantage of caching, and we don't want to re-enter on fetching duplicate tokens.
     */
    this.queue.next(() => this._getTokenInfoFromAddress(tokenAddress, resolver, rejector) );

    return promise;
  }

  public async getTokenInfoFromAddresses(tokenAddresses: Array<Address>): Promise<Array<ITokenInfo>> {
    const promises = new Array<Promise<ITokenInfo>>();

    tokenAddresses.forEach((address: Address) =>
    {
      promises.push(this.getTokenInfoFromAddress(address));
    });

    return Promise.all(promises);
  }

  geckoCoinInfo: Map<string, string>;

  getTokenGeckoMapKey(name: string, symbol: string): string {
    // PRIMEDao Token HACK!!!
    if (name.toLowerCase() === "primedao token") { name = "primedao"; }
    return `${name.toLowerCase()}_${symbol.toLowerCase()}`;
  }

  async getTokenGeckoId(name: string, symbol: string): Promise<string> {
    if (!this.geckoCoinInfo) {
      const uri = "https://api.coingecko.com/api/v3/coins/list";

      await axios.get(uri)
        .then((response) => {
          this.geckoCoinInfo = new Map<string, string>();

          response.data.map((tokenInfo: ITokenInfo) =>
            this.geckoCoinInfo.set(this.getTokenGeckoMapKey(tokenInfo.name, tokenInfo.symbol), tokenInfo.id));
        })
        .catch((error) => {
          if (process.env.NODE_ENV !== "development") {
            this.consoleLogService.logMessage(`TokenService: Error fetching token id for ${name}: ${error?.response?.data?.error?.message ?? error?.message}`, "warn");
          }
        });
    }

    if (this.geckoCoinInfo) {
      const id = this.geckoCoinInfo.get(this.getTokenGeckoMapKey(name, symbol));
      if (id) {
        return id;
      } else {
        this.consoleLogService.logMessage(`TokenService: Error fetching token info: token not found, or more than one match found (${name}/${symbol})`, "warn");
      }
    }
    return "";
  }

  public getTokenContract(tokenAddress: Address): Contract & IErc20Token {
    return new ethers.Contract(
      tokenAddress,
      this.erc20Abi,
      this.contractsService.createProvider()) as unknown as Contract & IErc20Token;
  }

  public getHolders(tokenAddress: Address): Promise<Array<ITokenHolder>> {
    const uri = `${this.getEthplorerUrl(`getTopTokenHolders/${tokenAddress}`)}&limit=1000`;
    return axios.get(uri)
      .then(async (response) => {
        const holders = response?.data?.holders ?? [];
        return holders.filter((holder: {address: string; balance: string, share: number }) => {
          holders.balance = BigNumber.from(toBigNumberJs(holder.balance).toString());
          return true;
        });
      })
      .catch((error) => {
        this.consoleLogService.logMessage(`TokenService: Error fetching token holders: ${error?.response?.data?.error?.message ?? error?.message}`, "error");
        // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token info"}`);
        // TODO:  restore the exception?
        return [];
      });
  }
}

export { IErc20Token, ITokenHolder, ITokenInfo, ITokenPrices } from "services/TokenTypes";
