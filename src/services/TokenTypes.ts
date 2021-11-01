import { BigNumber } from "ethers/lib/ethers";
import { Address } from "services/EthereumService";
import { TransactionResponse } from "services/TransactionsService";

export interface IErc20Token {
  allowance(owner: Address, spender: Address): Promise<BigNumber>;
  approve(spender: Address, amount: BigNumber): Promise<TransactionResponse>; // boolean
  balanceOf(account: Address): Promise<BigNumber>;
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
  decimals: number;
  logoURI: string;
  id: string; // id on coingecko
  name: string; // token name,
  price?: number;
  priceChangePercentage_24h?: number,
  symbol: string; // token symbol,
  // readonly tags?: string[];
  // readonly extensions?: {
  //   readonly [key: string]: string | number | boolean | null;
  // };
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

