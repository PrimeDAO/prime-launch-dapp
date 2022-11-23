import { FormatTypes, getAddress, Interface } from "ethers/lib/utils";
import { autoinject } from "aurelia-framework";
import { Contract, ethers } from "ethers";
import axios from "axios";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService, isLocalhostNetwork, Networks } from "services/EthereumService";
import { ConsoleLogService } from "services/ConsoleLogService";
import { from, Subject } from "rxjs";
import { concatMap } from "rxjs/operators";
import { IErc20Token, ITokenInfo } from "services/TokenTypes";
import { TokenListMap, TokenListService } from "services/TokenListService";
import TokenMetadataService from "services/TokenMetadataService";
import { AxiosService } from "services/axiosService";
import { TimingService } from "services/TimingService";
import CoingeckoData from "../../coingeckoData.json";

@autoinject
export class TokenService {

  erc20Abi: any;
  tokenInfos = new Map<Address, ITokenInfo>();
  queue: Subject<() => Promise<void>>;
  tokenLists: TokenListMap;
  devFundingTokens: Array<Address>;

  static DefaultLogoURI = "/genericToken.svg";
  static DefaultNameSymbol = "N/A";
  static DefaultDecimals = 0;

  constructor(
    private consoleLogService: ConsoleLogService,
    private contractsService: ContractsService,
    private tokenListService: TokenListService,
    private tokenMetadataService: TokenMetadataService,
    private axiosService: AxiosService) {

    this.erc20Abi = ContractsService.getContractAbi(ContractNames.IERC20);
    this.queue = new Subject<() => Promise<void>>();
    // this will initiate the execution of the promises
    // each promise is executed after the previous one has resolved
    this.queue.pipe(concatMap((resolver: () => Promise<void>) => {
      return from(resolver());
    }))
      .subscribe();
  }

  async initialize(): Promise<TokenListMap> {
    this.geckoCoinInfo = new Map<string, string>();

    if (isLocalhostNetwork()) {
      if (CoingeckoData && CoingeckoData.length) {
        CoingeckoData.map((tokenInfo: ITokenInfo) =>
          this.geckoCoinInfo.set(this.getTokenGeckoMapKey(tokenInfo.name, tokenInfo.symbol), tokenInfo.id));
      }
      return this.tokenLists = await this.tokenListService.fetchLists();
    }

    let uri;

    if (process.env.NODE_ENV === "development") {
      uri = "https://api.coingecko.com/api/v3/coins/list";
    } else {
      uri = `https://pro-api.coingecko.com/api/v3/coins/list?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
    }

    TimingService.start("get geckoCoinInfo");
    /**
     * prefetch all coingecko ids to use for fetching token prices, etc later
     */
    await axios.get(uri)
      .then((response) => {
        if (response.data && response.data.length) {
          response.data.map((tokenInfo: ITokenInfo) =>
            this.geckoCoinInfo.set(this.getTokenGeckoMapKey(tokenInfo.name, tokenInfo.symbol), tokenInfo.id));
        }
      });
    TimingService.end("get geckoCoinInfo");

    return this.tokenLists = await this.tokenListService.fetchLists();
  }

  geckoCoinInfo: Map<string, string>;

  private getTokenGeckoMapKey(name: string, symbol: string): string {
    if (name.toLowerCase() === "dai stablecoin") { name = "dai"; }
    if (name.toLowerCase() === "dstoken") { name = "dai"; } // kovan
    if (name.toLowerCase() === "wrapped ether") { name = "weth"; }
    return `${name.toLowerCase()}_${symbol.toLowerCase()}`;
  }

  private getTokenGeckoId(name: string, symbol: string): string {
    const id = this.geckoCoinInfo.get(this.getTokenGeckoMapKey(name, symbol));
    if (id) {
      return id;
    } else {
      this.consoleLogService.logMessage(`TokenService: Unable to find token info in CoinGecko: (${name}/${symbol})`, "warn");
      return "";
    }
  }

  /**
   * returns promise of a tokenInfo if a the metadata is found in the tokenLists or
   * a valid token contract is found.
   *
   * If there is an error, then throws an exception.
   */
  private async _getTokenInfoFromAddress(
    tokenAddress: Address,
    resolve: (tokenInfo: ITokenInfo) => void,
    reject: (reason?: any) => void): Promise<void> {

    let tokenInfo = this.tokenInfos.get(tokenAddress.toLowerCase());

    if (!tokenInfo) {

      TimingService.start(`_getTokenInfoFromAddress-${getAddress(tokenAddress)}`);

      tokenAddress = getAddress(tokenAddress);

      if (!tokenAddress) {
        reject(`Invalid token address: ${tokenAddress}`);
        return;
      }

      /**
       * fetchTokenMetadata will throw an exception if it can't at least find a contract at the
       * given address.  Otherwise it may return an incomplete tokenInfo.
       */
      const tokenInfoMap = await this.tokenMetadataService.fetchTokenMetadata([tokenAddress], this.tokenLists);
      // eslint-disable-next-line require-atomic-updates
      tokenInfo = tokenInfoMap[tokenAddress];
      if (!tokenInfo) {
        // is not a valid token contract, or some other error occurred
        reject(`Token does not appear to be a token contract: ${tokenAddress}`);
        return;
      }

      /**
       * Set defaults for missing values
       */
      if (!tokenInfo.name) {
        tokenInfo.name = TokenService.DefaultNameSymbol;
      }
      if (!tokenInfo.symbol) {
        tokenInfo.symbol = TokenService.DefaultNameSymbol;
      }
      if (!tokenInfo.decimals) {
        tokenInfo.decimals = TokenService.DefaultDecimals;
      }

      if (!tokenInfo.logoURI) {
        tokenInfo.logoURI = TokenService.DefaultLogoURI;
      }

      this.tokenInfos.set(tokenAddress.toLowerCase(), tokenInfo);
      TimingService.end(`_getTokenInfoFromAddress-${tokenAddress}`);
      this.consoleLogService.logMessage(`loaded token: ${tokenAddress}`, "info");
    }

    resolve(tokenInfo);
  }

  /**
   * For a list of tokens, efficiently fetch current token prices from coingecko.
   * Note this does not get the token logo.
   * @param tokenInfos
   */
  public async getTokenPrices(tokenInfos: Array<ITokenInfo>): Promise<void> {

    TimingService.start("getTokenPrices");

    const tokensByGeckoId = new Map<string, ITokenInfo>();

    tokenInfos.forEach((tokenInfo) => {
      if (tokenInfo.price === undefined) {
        if (!tokenInfo.id) {
          tokenInfo.id = this.getTokenGeckoId(tokenInfo.name, tokenInfo.symbol);
        }
        if (tokenInfo.id) {
          tokensByGeckoId.set(tokenInfo.id, tokenInfo);
        }
      }
    });

    if (tokensByGeckoId.size) {

      let uri;

      if (process.env.NODE_ENV === "development") {
        // uri = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=USD%2CUSD&ids=${Array.from(tokensByGeckoId.keys()).join(",")}`;
        uri = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=USD%2CUSD&ids=${Array.from(tokensByGeckoId.keys()).join(",")}&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
      } else {
        // uri = `https://pro-api.coingecko.com/api/v3/coins/list?x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
        uri = `https://pro-api.coingecko.com/api/v3/simple/price?vs_currencies=USD%2CUSD&ids=${Array.from(tokensByGeckoId.keys()).join(",")}&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
      }
      await axios.get(uri)
        .then((response) => {
          const keys = Object.keys(response.data);
          const keyCount = keys.length;
          for (let i = 0; i < keyCount; ++i) {
            const tokenId = keys[i];
            const tokenInfo = tokensByGeckoId.get(tokenId);
            tokenInfo.price = response.data[tokenId].usd;
          }
        })
        .catch((error) => {
          this.consoleLogService.logMessage(`PriceService: Error fetching token price ${this.axiosService.axiosErrorHandler(error)}`);
        });
    }

    TimingService.end("getTokenPrices");
  }

  public async getTokenInfoFromAddress(tokenAddress: Address): Promise<ITokenInfo> {

    let resolver: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void;
    let rejector: (reason?: any) => void;

    const promise = new Promise<ITokenInfo>((
      resolve: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void,
      reject: (reason?: any) => void,
    ): void => {
      resolver = resolve;
      rejector = (reason?: any) => {
        this.consoleLogService.logMessage(reason, "error");
        reject(reason);
      };
    });

    /**
     * Fetch tokens one-at-a-time because many requests will be redundant, we want them
     * to take advantage of caching, and we don't want to re-enter on fetching duplicate tokens.
     */
    this.queue.next(() => this._getTokenInfoFromAddress(tokenAddress, resolver, rejector) );

    return promise;
  }

  /**
   * Get the tokenInfos from a specified list.
   * @param tokenListUri
   * @returns
   */
  public async getTokenInfosFromTokenList(tokenListUri: string): Promise<Array<ITokenInfo>> {
    const tokenInfos = this.tokenLists[tokenListUri].tokens;

    tokenInfos.forEach((tokenInfo) => {
      const tokenAddress = tokenInfo.address;
      if (!this.tokenInfos.get(tokenAddress.toLowerCase())) {
        this.tokenInfos.set(tokenAddress.toLowerCase(), tokenInfo);
        this.consoleLogService.logMessage(`registered token: ${tokenAddress}`, "info");
      }
    });

    await this.getTokenPrices(tokenInfos);

    return tokenInfos;
  }

  public getTokenContract(tokenAddress: Address): Contract & IErc20Token {
    return new ethers.Contract(
      tokenAddress,
      this.erc20Abi,
      this.contractsService.createProvider()) as unknown as Contract & IErc20Token;
  }

  /**
   * fetch token price and logo from coingecko
   * @param tokenInfo
   * @returns
   */
  public getTokenGeckoInfo(tokenInfo: ITokenInfo): Promise<ITokenInfo> {

    if (!tokenInfo.id) {
      tokenInfo.id = this.getTokenGeckoId(tokenInfo.name, tokenInfo.symbol);
    }

    if (tokenInfo.id) { // else is not in coingecko
      const uri = `https://pro-api.coingecko.com/api/v3/coins/${tokenInfo.id}?market_data=true&localization=false&community_data=false&developer_data=false&sparkline=false&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;

      return axios.get(uri)
        .then((response) => {
          tokenInfo.price = response.data.market_data.current_price.usd ?? 0;
          // tokenInfo.priceChangePercentage_24h = response.data.market_data.price_change_percentage_24h ?? 0;
          if (!tokenInfo.logoURI || (tokenInfo.logoURI === TokenService.DefaultLogoURI)) {
            tokenInfo.logoURI = response.data.image.thumb;
          }
          return tokenInfo;
        })
        .catch((ex) => {
          this.consoleLogService.logMessage(`PriceService: Error fetching token price ${this.axiosService.axiosErrorHandler(ex)}`, "error");
          return tokenInfo;
        });
    } else {
      return Promise.resolve(tokenInfo);
    }
  }

  public async isERC20Token(tokenAddress: Address): Promise<boolean> {
    let isOk = true;

    TimingService.start(`isERC20Token-${tokenAddress}`);
    const contract = this.getTokenContract(tokenAddress);
    if (contract) {

      try {
        await contract.deployed();
      } catch {
        return false;
      }

      try {
        if (EthereumService.targetedNetwork === Networks.Mainnet) {

          const proxyImplementation = await this.contractsService.getProxyImplementation(tokenAddress);
          if (proxyImplementation) {
            tokenAddress = proxyImplementation;
          }

          const contractAbi = await axios.get(`https://api.etherscan.io/api?module=contract&action=getabi&address=${tokenAddress}&apikey=${process.env.ETHERSCAN_KEY}`)
            .then((result) => {
              return result.data.message !== "OK" ? null : result.data.result;
            });

          if (!contractAbi) {
            throw new Error("ABI not obtainable, contract may not be verified in etherscan");
          }

          const contractInterface = new Interface(contractAbi);
          const ierc20Abi = ContractsService.getContractAbi(ContractNames.IERC20);
          const ierc20Interface = new Interface(ierc20Abi);

          for (const functionName in ierc20Interface.functions) {
            const contractFunction = contractInterface.functions[functionName];
            if (!contractFunction ||
                (contractFunction.format(FormatTypes.minimal) !== ierc20Interface.functions[functionName].format(FormatTypes.minimal))) {
              isOk = false;
              this.consoleLogService.logMessage(`TokenService: Token ${tokenAddress} fails to implement IERC20 on function: ${functionName}`, "error");
              break;
            }
          }
          if (isOk) {
            for (const eventName in ierc20Interface.events) {
              const contractEvent = contractInterface.events[eventName];
              if (!contractEvent ||
                  (contractEvent.format(FormatTypes.minimal) !== ierc20Interface.events[eventName].format(FormatTypes.minimal))) {
                isOk = false;
                this.consoleLogService.logMessage(`TokenService: Token ${tokenAddress} fails to implement IERC20 on event: ${eventName}`, "error");
                break;
              }
            }
          }
        } else { // a testnet, just do this
          await contract.totalSupply();
        }
        // eslint-disable-next-line no-empty
      } catch (error) {
        this.consoleLogService.logMessage(`TokenService: Error confirming IERC20: ${error?.response?.data?.error?.message ?? error?.message}`, "error");
        isOk = false;
      }
    } else { // not sure this ever actually happens
      isOk = false;
    }
    TimingService.end(`isERC20Token-${tokenAddress}`);

    return isOk;
  }
}

export { IErc20Token, ITokenHolder, ITokenInfo, ITokenPrices } from "services/TokenTypes";
