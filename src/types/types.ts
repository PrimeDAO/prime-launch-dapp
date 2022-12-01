import { BigNumber } from "ethers";

export type Address = string;

export enum SeedVersions {
  v1 = "1.0.0",
  v2 = "2.0.0",
}

export interface ITokenInfo {
  address: Address;
  decimals: number;
  logoURI: string;
  id: string; // id on coingecko
  name: string; // token name,
  price?: number;
  symbol: string; // token symbol,
  chainId: number;
  // readonly tags?: string[];
  // readonly extensions?: {
  //   readonly [key: string]: string | number | boolean | null;
  // };
}

/**
 * Note: `interface` instead of `type`, because of type hinting.
 *   `type ABC = BigNumber` shows `BigNumber` instead of `ABC`
 */
export interface IFundingToken extends BigNumber {}

export interface IContractContributorClasses {
  classNames: string[];
  classCaps: IFundingToken[];
  individualCaps: IFundingToken[];
  vestingDurations: BigNumber[];
  vestingCliffs: BigNumber[];
  classFundingsCollected: BigNumber[]; // Keeps track of how much already was collected
}

export interface IAddClassParams {
  classNames: string[];
  classCaps: IFundingToken[];
  individualCaps: IFundingToken[];
  classVestingDurations: number[];
  classVestingCliffs: number[];
  classAllowlists: Set<string>[],
}
