import { FormatTypes, getAddress, Interface } from "ethers/lib/utils";
import { autoinject } from "aurelia-framework";
import { Contract, ethers } from "ethers";
import axios from "axios";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService, Networks } from "services/EthereumService";
import { ConsoleLogService } from "services/ConsoleLogService";
import { from, Subject } from "rxjs";
import { concatMap } from "rxjs/operators";
import { IErc20Token, ITokenInfo } from "services/TokenTypes";
import { TokenListMap, TokenListService } from "services/TokenListService";
import TokenMetadataService from "services/TokenMetadataService";
import { Utils } from "services/utils";

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
    private ethereumService: EthereumService,
    private consoleLogService: ConsoleLogService,
    private contractsService: ContractsService,
    private tokenListService: TokenListService,
    private tokenMetadataService: TokenMetadataService) {

    this.devFundingTokens = (ethereumService.targetedNetwork === Networks.Rinkeby) ?
      [
        "0x80E1B5fF7dAdf3FeE78F60D69eF1058FD979ca64",
        "0xc778417E063141139Fce010982780140Aa0cD5Ab",
        "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
        "0x7ba433d48c43e3ceeb2300bfbf21db58eecdcd1a", // USDC having 6 decimals
      ] : (ethereumService.targetedNetwork === Networks.Kovan) ?
        [
          "0xBE778562b804DF11d0f1C02ADD3cE963E465dd70", // PRIME
          "0xdFCeA9088c8A88A76FF74892C1457C17dfeef9C1", // WETH
          "0x04DF6e4121c27713ED22341E7c7Df330F56f289B", // DAI
          "0xc2569dd7d0fd715B054fBf16E75B001E5c0C1115", // USDC having 6 decimals
        ] : [];


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
    const uri = "https://api.coingecko.com/api/v3/coins/list";

    await axios.get(uri)
      .then((response) => {
        if (response.data && response.data.length) {
          response.data.map((tokenInfo: ITokenInfo) =>
            this.geckoCoinInfo.set(this.getTokenGeckoMapKey(tokenInfo.name, tokenInfo.symbol), tokenInfo.id));
        }
      });

    return this.tokenLists = await this.tokenListService.fetchLists();
  }

  private getEthplorerUrl(api: string) {
    // note ethplorer only works on mainnet and kovan
    return `https://${this.ethereumService.targetedNetwork === Networks.Mainnet ? "" : `${this.ethereumService.targetedNetwork}-`}api.ethplorer.io/${api}?apiKey=${process.env.ETHPLORER_KEY}`;
  }

  /**
   * returns promise of a tokenInfo if a the metadata is found in the tokenLists or
   * a valid token contract is found.
   *
   * If there is an error, then throws an exception.
   */
  private async _getTokenInfoFromAddress(tokenAddress: Address,
    resolve: (tokenInfo: ITokenInfo) => void,
    reject: (reason?: any) => void): Promise<void> {

    let tokenInfo = this.tokenInfos.get(tokenAddress.toLowerCase());

    if (!tokenInfo) {

      tokenAddress = getAddress(tokenAddress);

      if (!tokenAddress) {
        reject(`Invalid token address: ${tokenAddress}`);
        return;
      }

      if (!await this.isERC20Token(tokenAddress)) {
        reject(`Token address does not reference an IERC20 contract: ${tokenAddress}`);
        return;
      }

      /**
       * fetchTokenMetadata will throw an exception if it can't at least find a contract at the
       * given address.  Otherwise it may return an incomplete tokenInfo.
       */
      const tokenInfoMap = await this.tokenMetadataService.fetchTokenMetadata([tokenAddress], this.tokenLists);
      // eslint-disable-next-line require-atomic-updates
      tokenInfo = tokenInfoMap[tokenAddress];
      if (tokenInfo) {
        // eslint-disable-next-line require-atomic-updates
        tokenInfo.id = await this.getTokenGeckoId(tokenInfo.name, tokenInfo.symbol);
      } else {
        // is not a valid token contract, or some other error occurred
        reject(`Token does not appear to be a token contract: ${tokenAddress}`);
        return;
      }

      /**
       * at this point we have at least some of the metadata, if not all, and
       * having the tokenInfo.id, we have a shot at getting a price for it from coingecko.
       *
       * We'll go ahead an fill in some default values for the token.
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

      // tokenInfo.priceChangePercentage_24h = 0;

      /**
       * try to get the token USD price, take a last shot at getting a logoURI.
       */
      if (tokenInfo.id) {
        const uri = `https://api.coingecko.com/api/v3/coins/${tokenInfo.id}?market_data=true&localization=false&community_data=false&developer_data=false&sparkline=false`;

        await axios.get(uri)
          .then((response) => {
            tokenInfo.price = response.data.market_data.current_price.usd ?? 0;
            // tokenInfo.priceChangePercentage_24h = response.data.market_data.price_change_percentage_24h ?? 0;
            if (!tokenInfo.logoURI) {
              tokenInfo.logoURI = response.data.image.thumb;
            }
          })
          .catch((ex) => {
            this.consoleLogService.logMessage(`PriceService: Error fetching token price ${Utils.extractExceptionMessage(ex)}`, "error");
          });
      }

      if (!tokenInfo.logoURI) {
        tokenInfo.logoURI = TokenService.DefaultLogoURI;
      }

      this.tokenInfos.set(tokenAddress.toLowerCase(), tokenInfo);
      this.consoleLogService.logMessage(`loaded token: ${tokenAddress}`, "info");
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

  public async getTokenInfoFromAddresses(tokenAddresses: Array<Address>): Promise<Array<ITokenInfo>> {
    const tokenInfos = new Array<ITokenInfo>();

    for (const address of tokenAddresses) {
      try {
        const tokenInfo = await this.getTokenInfoFromAddress(address);
        tokenInfos.push(tokenInfo);
        // eslint-disable-next-line no-empty
      } catch { }
    }

    return tokenInfos;
  }

  /**
   * Get the tokenInfos from a specified list
   * @param tokenListUri
   * @returns
   */
  public getTokenInfosFromTokenList(tokenListUri: string): Array<ITokenInfo> {
    return this.tokenLists[tokenListUri].tokens;
  }

  geckoCoinInfo: Map<string, string>;

  getTokenGeckoMapKey(name: string, symbol: string): string {
    // PRIMEDao Token HACK!!!
    if (name.toLowerCase() === "primedao token") { name = "primedao"; }
    if (name.toLowerCase() === "dai stablecoin") { name = "dai"; }
    if (name.toLowerCase() === "DSToken") { name = "dai"; } // kovan
    return `${name.toLowerCase()}_${symbol.toLowerCase()}`;
  }

  async getTokenGeckoId(name: string, symbol: string): Promise<string> {
    const id = this.geckoCoinInfo.get(this.getTokenGeckoMapKey(name, symbol));
    if (id) {
      return id;
    } else {
      this.consoleLogService.logMessage(`TokenService: Unable to find token info in CoinGecko: (${name}/${symbol})`, "warn");
      return "";
    }
  }

  public getTokenContract(tokenAddress: Address): Contract & IErc20Token {
    return new ethers.Contract(
      tokenAddress,
      this.erc20Abi,
      this.contractsService.createProvider()) as unknown as Contract & IErc20Token;
  }

  // public getHolders(tokenAddress: Address): Promise<Array<ITokenHolder>> {
  //   const uri = `${this.getEthplorerUrl(`getTopTokenHolders/${tokenAddress}`)}&limit=1000`;
  //   return axios.get(uri)
  //     .then(async (response) => {
  //       const holders = response?.data?.holders ?? [];
  //       return holders.filter((holder: {address: string; balance: string, share: number }) => {
  //         holders.balance = BigNumber.from(toBigNumberJs(holder.balance).toString());
  //         return true;
  //       });
  //     })
  //     .catch((error) => {
  //       this.consoleLogService.logMessage(`TokenService: Error fetching token holders: ${error?.response?.data?.error?.message ?? error?.message}`, "error");
  //       // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token info"}`);
  //       // TODO:  restore the exception?
  //       return [];
  //     });
  // }

  public async isERC20Token(tokenAddress: Address): Promise<boolean> {
    let isOk = true;

    const contract = this.getTokenContract(tokenAddress);
    if (contract) {

      try {
        await contract.deployed();
      } catch {
        return false;
      }

      try {
        if (this.ethereumService.targetedNetwork === Networks.Mainnet) {

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
    return isOk;
  }
}

export { IErc20Token, ITokenHolder, ITokenInfo, ITokenPrices } from "services/TokenTypes";
