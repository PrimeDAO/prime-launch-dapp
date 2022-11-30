import { BigNumberish, BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";

import { ISeedConfig } from "../newLaunch/seed/config";
import { Utils } from "../services/utils";
import { Address, ITokenInfo } from "../types/types";

export const DEFAULT_DECIMALS = 18;
export const ONE_DAY_IN_SECONDS = 60 * 60 * 24;


/**
 * @param ethValue
 * @param decimals Default is 18.  Can be decimal count or:
 *  "wei",
 *  "kwei",
 *  "mwei",
 *  "gwei",
 *  "szabo",
 *  "finney",
 *  "ether",
 * @returns
 */
export const toWei = (
  ethValue: BigNumberish,
  decimals: string | number = 18,
): BigNumber => {
  const t = typeof ethValue;
  if (t === "string" || t === "number") {
    // avoid underflows
    ethValue = Utils.truncateDecimals(Number(ethValue), Number(decimals));
  }
  return parseUnits(ethValue.toString(), decimals);
};

/**
 * @param weiValue
 * @param decimals Default is 18.  Can be decimal count or:
 *  "wei",
 *  "kwei",
 *  "mwei",
 *  "gwei",
 *  "szabo",
 *  "finney",
 *  "ether",
 * @returns
 */
export const fromWei = (weiValue: BigNumberish, decimals: string | number = 18): string => {
  return formatUnits(weiValue.toString(), decimals);
};

export class Shared {
  public static convertToContractSeedParam(
    config: ISeedConfig,
    safeAddress: Address,
    metaDataHash: string,
  ): unknown[] {
    const pricePerToken = this.projectTokenPriceInWei(
      config.launchDetails.pricePerToken,
      config.launchDetails.fundingTokenInfo,
      config.tokenDetails.projectTokenInfo,
    );

    const seedArguments = [
      safeAddress,
      config.launchDetails.adminAddress,
      [
        config.tokenDetails.projectTokenInfo.address,
        config.launchDetails.fundingTokenInfo.address,
      ],
      [config.launchDetails.fundingTarget, config.launchDetails.fundingMax],
      pricePerToken,
      [
        // convert from ISO string to Unix epoch seconds
        Date.parse(config.launchDetails.startDate) / 1000,
        // convert from ISO string to Unix epoch seconds
        Date.parse(config.launchDetails.endDate) / 1000,
      ],
      [
        config.launchDetails.individualCap,
        config.launchDetails.vestingCliff,
        config.launchDetails.vestingPeriod,
      ],
      config.launchDetails.isPermissoned,
      config.launchDetails.allowList ?? [],
      [toWei(config.launchDetails.seedTip / 100 ?? 0.0), 0, 0],
      Utils.asciiToHex(metaDataHash),
    ];

    return seedArguments;
  }

  private static projectTokenPriceInWei(
    pricePerTokenAsEth: number,
    fundingToken: ITokenInfo,
    projectToken: ITokenInfo,
  ): BigNumber {
    return toWei(
      pricePerTokenAsEth,
      this.projectTokenPriceDecimals(fundingToken, projectToken),
    );
  }

  private static projectTokenPriceDecimals(
    fundingTokenInfo: ITokenInfo,
    projectTokenInfo: ITokenInfo,
  ): number {
    return fundingTokenInfo.decimals - projectTokenInfo?.decimals + 18;
  }
}

