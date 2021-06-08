import { autoinject } from "aurelia-framework";
import { BigNumber, Contract, ethers } from "ethers";
import axios from "axios";
import { ContractNames, ContractsService } from "services/ContractsService";
import { Address, EthereumService, Networks } from "services/EthereumService";
import { ConsoleLogService } from "services/ConsoleLogService";
import { TransactionResponse } from "services/TransactionsService";
import { toBigNumberJs } from "services/BigNumberService";
import { from, Subject } from "rxjs";
import { concatMap } from "rxjs/operators";

export interface IErc20Token {
  allowance(owner: Address, spender: Address): Promise<BigNumber>;
  approve(spender: Address, amount: BigNumber): Promise<TransactionResponse>; // boolean
  balanceOf(account: Address): Promise<BigNumber>;
  name(): Promise<string>;
  totalSupply(): Promise<BigNumber>;
  transfer(recipient: Address, amount: BigNumber): Promise<TransactionResponse>; // boolean
  transferFrom(sender: Address, recipient: Address, amount: BigNumber): Promise<TransactionResponse>; // boolean
}

export interface ITokenPrices {
  // key is "weth" or "primedao"
  [key: string]: number;
}

export interface ITokenInfo {
  address: Address;
  icon: string;
  id: string; // id on coingecko
  name: string; // token name,
  price: number;
  // priceChangePercentage_24h: number;
  // priceChangePercentage_7d: number;
  // priceChangePercentage_30d: number;
  symbol: string; // token symbol,
}

export interface ITokenHolder {
  /**
   * address of holder
   */
  address: Address;
  /**
   * token balance
   */
  balance: BigNumber;
  /**
   * share of holder in percent
   */
  share: number;
}

@autoinject
export class TokenService {

  erc20Abi: any;
  tokenInfos = new Map<Address, ITokenInfo>();
  queue: Subject<() => Promise<void>>;

  constructor(
    private ethereumService: EthereumService,
    private consoleLogService: ConsoleLogService,
    contractsService: ContractsService) {
    this.erc20Abi = contractsService.getContractAbi(ContractNames.ERC20);
    this.queue = new Subject<() => Promise<void>>();
    // this will initiate the execution of the promises
    // each promise is executed after the previous one has resolved
    this.queue.pipe(concatMap((resolver: () => Promise<void>) => {
      return from(resolver());
    }))
      .subscribe();
  }

  private getEthplorerUrl(api: string) {
    // note ethplorer only works on mainnet and kovan
    return `https://${this.ethereumService.targetedNetwork === Networks.Mainnet ? "" : `${this.ethereumService.targetedNetwork}-`}api.ethplorer.io/${api}?apiKey=${process.env.ETHPLORER_KEY}`;
  }

  private async _getTokenInfoFromAddress(address: Address,
    resolve: (tokenInfo: ITokenInfo) => void,
    _rejector: (reason?: any) => void): Promise<void> {

    let tokenInfo = this.tokenInfos.get(address.toLowerCase());

    if (!tokenInfo) {
      // eslint-disable-next-line require-atomic-updates
      tokenInfo = {
        address,
        icon: "/genericToken.svg",
        id: "",
        name: "Unknown",
        price: 0,
        symbol: "N/A",
      };

      this.consoleLogService.logMessage(`loaded token: ${address}`, "info");

      if (["mainnet", "kovan"].includes(this.ethereumService.targetedNetwork)) {
        const uri = this.getEthplorerUrl(`getTokenInfo/${address}`);
        // eslint-disable-next-line require-atomic-updates
        await axios.get(uri)
          .then(async (response) => {
            tokenInfo = response.data;
            // eslint-disable-next-line require-atomic-updates
            tokenInfo.id = await this.getTokenGeckoId(tokenInfo.name, tokenInfo.symbol);
          })
          .catch((error) => {
            this.consoleLogService.logMessage(`TokenService: Error fetching token info: ${error?.response?.data?.error?.message ?? error?.message}`, "error");
            // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token info"}`);
            // TODO:  restore the exception?
          });
      }

      this.tokenInfos.set(address.toLowerCase(), tokenInfo);

      if (tokenInfo.id) {
        const uri = `https://api.coingecko.com/api/v3/coins/${tokenInfo.id}?market_data=true&localization=false&community_data=false&developer_data=false&sparkline=false`;

        await axios.get(uri)
          .then((response) => {
            tokenInfo.price = response.data.market_data.current_price.usd ?? 0;
            tokenInfo.icon = response.data.image.thumb;
          })
          .catch((error) => {
            this.consoleLogService.logMessage(`PriceService: Error fetching token price ${error?.message}`, "error");
          });
      }
    }

    resolve(tokenInfo);
  }

  public async getTokenInfoFromAddress(address: Address): Promise<ITokenInfo> {

    let resolver: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void;
    let rejector: (reason?: any) => void;

    const promise = new Promise<ITokenInfo>((
      resolve: (value: ITokenInfo | PromiseLike<ITokenInfo>) => void,
      reject: (reason?: any) => void,
    ): void => {
      resolver = resolve;
      rejector = reject;
    });

    this.queue.next(() => this._getTokenInfoFromAddress(address, resolver, rejector) );

    return promise;
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
            this.consoleLogService.logMessage(`TokenService: Error fetching token info: ${error?.response?.data?.error?.message ?? error?.message}`, "warn");
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
      this.ethereumService.readOnlyProvider) as unknown as Contract & IErc20Token;
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
