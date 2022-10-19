import { SUBGRAPH_URLS } from "services/BalancerService";
import { fromWei } from "./EthereumService";
import { EthereumService, Networks } from "services/EthereumService";

import { DateService } from "services/DateService";
import { NumberService } from "services/NumberService";
import { TokenService } from "services/TokenService";
import { LbpManager } from "entities/LbpManager";
import { LbpProjectTokenPriceService } from "./LbpProjectTokenPriceService";
import { Lbp } from "entities/Lbp";

import { jsonToGraphQLQuery } from "json-to-graphql-query";
import axios from "axios";
import { autoinject } from "aurelia-framework";

interface ISwapRecord {
  timestamp: number,
  tokenIn: string,
  tokenAmountIn: string,
  tokenAmountOut: string,
  priceUSD: number,
}

export interface IHistoricalPriceRecord { time: number, price?: number }

@autoinject
export class ProjectTokenHistoricalPriceService {

  public lastSwap: ISwapRecord;
  constructor(
    private dateService: DateService,
    private tokenService: TokenService,
    private lbpProjectTokenPriceService: LbpProjectTokenPriceService,
    private ethereumService: EthereumService,
    private numberService: NumberService,
    private priceService: LbpProjectTokenPriceService,
  ) {}

  private getBalancerSubgraphUrl(): string {
    return SUBGRAPH_URLS[EthereumService.targetedNetwork];
  }

  private getCoingeckoUrl(fundingTokenId: string, startTime: number, endTime: number): string {
    return `https://pro-api.coingecko.com/api/v3/coins/${fundingTokenId}/market_chart/range?vs_currency=usd&from=${startTime}&to=${endTime}&x_cg_pro_api_key=${process.env.COINGECKO_API_KEY}`;
  }

  private nearestUSDPriceAtTimestamp(prices: Array<number>, timestamp: number): number {
    const fundingTokenPricesUSD = prices.map(price => {
      return {
        timestamp: price[0],
        priceInUSD: price[1],
      };
    }) || [{ timestamp: 0, priceInUSD: 0 }];
    const res = fundingTokenPricesUSD.filter(price => price.timestamp / 1000 <= timestamp );

    return res[res.length - 1]?.priceInUSD ?? 0;
  }

  private async getFundingTokenUSDPricesByID(tokenId: string, endTimeSeconds: number, startTimeSeconds: number, intervalMinutes: number): Promise<Array<number>> {
    return await(await axios.get(
      this.getCoingeckoUrl(
        tokenId,
        (startTimeSeconds - intervalMinutes * 60 /*hour back*/),
        endTimeSeconds,
      ),
    ))?.data?.prices || [];
  }

  /**
   * Get Project Token Price History, in USD
   *
   * The timepoints in the returned array will be relative to the UTC timezone.
   * startTime and endTime, which, according to the LBPManager entity, are in the user's timezone would be converted to UTC.
   *
   * @param lbpMgr LBP Manager object
   * @returns Array(IHistoricalPriceRecord): {time: number, price?: number}
   */
  public async getPricesHistory(lbpMgr: LbpManager): Promise<Array<IHistoricalPriceRecord>> {
    if (!lbpMgr.lbp || !lbpMgr.lbp.poolId || lbpMgr.hasNotStarted) {
      return [];
    }

    const intervalMinutes = 60/*min*/;
    const intervalSeconds = intervalMinutes * 60/* sec */;
    const startTime = lbpMgr.startTime.getTime() / 1000;
    const endTime = lbpMgr.endTime.getTime() / 1000;
    const currentTime = this.dateService.utcNow.getTime() / 1000;
    /* Rounded to the nearest hour */
    const startTimeSeconds = (Math.floor(startTime / intervalSeconds) * intervalSeconds)/* Rounded */;
    const endTimeSeconds = Math.floor(Math.min(endTime, currentTime) / intervalSeconds) * intervalSeconds + intervalSeconds; // rounded hour

    /**
     * subgraph will return a maximum of 1000 records at a time.  so for a very active pool,
     * in a single query you can potentially obtain data for only a small slice of calendar time.
     *
     * So we fetch going backwards from today, 1000 at a time, until we've got all the records.
     */
    let swaps = new Array<ISwapRecord>();
    let fetched: Array<ISwapRecord>;
    let index = 0;
    do {
      /**
       * fetchSwaps returns swaps in descending time order, so the last one will be
       * the earliest one.
       */
      fetched = await this.fetchSwaps(endTimeSeconds, startTime, index, lbpMgr.lbp);
      swaps = swaps.concat(fetched);
      index++;
    } while (fetched.length === 1000);

    const returnArray = new Array<IHistoricalPriceRecord>();

    const startFundingTokenAmount = this.numberService.fromString(fromWei(lbpMgr.startingFundingTokenAmount, lbpMgr.fundingTokenInfo.decimals));
    const startProjectTokenAmount = this.numberService.fromString(fromWei(lbpMgr.startingProjectTokenAmount, lbpMgr.projectTokenInfo.decimals));

    const prices = await this.getFundingTokenUSDPricesByID(
      lbpMgr.fundingTokenInfo.id,
      endTimeSeconds,
      startTimeSeconds < currentTime ? startTimeSeconds : Math.floor(currentTime) - 3600,
      intervalMinutes,
    );

    let previousTimePoint;
    let previousUsdPriceAtTimePoint;

    // first swap amounts should be weighted after the lbp start weight
    swaps.push({
      timestamp: startTimeSeconds,
      tokenIn: lbpMgr.fundingTokenInfo.address,
      tokenAmountOut: (startProjectTokenAmount / (lbpMgr.projectTokenStartWeight)).toString(),
      tokenAmountIn: (startFundingTokenAmount / (1 - lbpMgr.projectTokenStartWeight)).toString(),
      priceUSD: this.nearestUSDPriceAtTimestamp(prices, startTimeSeconds),
    });

    swaps.reverse(); // to ascending

    const lastSwap = await this.fetchLastSwap(endTimeSeconds, startTimeSeconds, lbpMgr);

    /**
     * enumerate every day
     */
    for (let timestamp = startTimeSeconds; timestamp < endTimeSeconds; timestamp += intervalSeconds) {

      const todaysSwaps = new Array<ISwapRecord>();
      const nextInterval = timestamp + intervalSeconds;

      if (swaps.length) {
      // eslint-disable-next-line no-constant-condition
        while (true) {
          const swap = swaps[0];
          if (swap.timestamp >= nextInterval) {
            break;
          }
          else if (swap.timestamp >= timestamp) {
            todaysSwaps.push(swap);
            swaps.shift();
            if (!swaps.length) {
              break;
            }
          } // swap.timestamp < timestamp
        }
      }


      if (todaysSwaps?.length) {
        const usdPriceAtTimePoint = this.nearestUSDPriceAtTimestamp(prices, todaysSwaps[todaysSwaps.length-1].timestamp );

        const price = todaysSwaps[todaysSwaps.length-1].tokenIn.toLowerCase() === lbpMgr.fundingTokenInfo.address.toLowerCase()
          ? (
            (this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) * (1 + lbpMgr.swapFeePercentage)) /
            (this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut))
          )
          : (
            (this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut)) /
            (this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) * (1 + lbpMgr.swapFeePercentage))
          );

        returnArray.push({
          price: price * usdPriceAtTimePoint,
          time: timestamp,
        });

        previousTimePoint = price;
        previousUsdPriceAtTimePoint = usdPriceAtTimePoint;
      } else if (previousTimePoint) {
        /**
         * previous value effected by USD course change
         */
        if (lastSwap.timestamp <= swaps[swaps.length - 1]?.timestamp) {
          returnArray.push({
            price: (
              previousTimePoint *
              previousUsdPriceAtTimePoint
            ),
            time: timestamp,
          });
        }
      } else {
        returnArray.push({
          time: timestamp,
        });
      }
    }

    /**
     * If the last swap is before the current time, we need to add a
     * calculated forecast to the end of the array up to the current time.
     */
    const forecastData = await this.getTrajectoryForecastData(lbpMgr);
    const pastForecast = forecastData?.filter((item) => item.time < Math.min(currentTime, endTime));
    returnArray.pop(); // avoid duplicate last item

    /**
     * Calculate the initial price of the pool based on the initial funding sums
     * as if it's the first swap.
     */
    const initialFundingSwap = {
      time: startTimeSeconds - intervalSeconds,
      price: this.priceService.getPriceAtWeight(
        startProjectTokenAmount,
        startFundingTokenAmount,
        lbpMgr.projectTokenStartWeight,
        this.nearestUSDPriceAtTimestamp(prices, startTimeSeconds),
      ),
    };
    return [initialFundingSwap, ...returnArray, ...pastForecast];
  }

  private usdPriceAtLastSwap: number;

  public async getTrajectoryForecastData(lbpMgr: LbpManager): Promise<Array<IHistoricalPriceRecord>> {
    const lastSwap = await this.fetchLastSwap(lbpMgr.endTime.getTime() / 1000, lbpMgr.startTime.getTime() / 1000, lbpMgr);

    const intervalMinutes = 60/*min*/;
    const intervalSeconds = intervalMinutes * 60/* sec */;
    const startTime = lbpMgr.startTime.getTime() / 1000;
    const endTime = lbpMgr.endTime.getTime() / 1000;
    const currentTime = this.dateService.utcNow.getTime() / 1000;
    const historicalStartTimeSeconds = (Math.floor(startTime / intervalSeconds) * intervalSeconds)/* Rounded */;
    const historicalEndTimeSeconds = Math.floor(Math.min(endTime, currentTime) / intervalSeconds) * intervalSeconds + intervalSeconds; // rounded hour

    const prices = await this.getFundingTokenUSDPricesByID(
      lbpMgr.fundingTokenInfo.id,
      historicalEndTimeSeconds,
      (historicalStartTimeSeconds < currentTime) ? historicalStartTimeSeconds : (Math.floor(currentTime) - 3600),
      intervalMinutes,
    );

    lastSwap.priceUSD = this.nearestUSDPriceAtTimestamp(prices, lastSwap.timestamp);
    const lastSwapWeight = this.priceService.getProjectTokenWeightAtTime(
      new Date(lastSwap.timestamp * 1000),
      lbpMgr.startTime,
      lbpMgr.endTime,
      lbpMgr.projectTokenStartWeight,
      lbpMgr.projectTokenEndWeight,
    );

    const lastSwapDate = this.dateService.ticksToDate(lastSwap.timestamp * 1000);
    const poolPTBalance = this.numberService.fromString(fromWei(lbpMgr.lbp.vault.projectTokenBalance, lbpMgr.projectTokenInfo.decimals));
    const poolFTBalance = this.numberService.fromString(fromWei(lbpMgr.lbp.vault.fundingTokenBalance, lbpMgr.fundingTokenInfo.decimals));
    const projectTokenAmount = this.numberService.fromString(lastSwap.tokenAmountOut);
    const forecastData = await this.priceService.getInterpolatedPriceDataPoints(
      poolPTBalance,
      poolFTBalance,
      {
        start: lastSwapDate,
        end: lbpMgr.endTime,
      },
      {
        /**
         * Special case:
         * If no swaps have been made, we can't calculate the last swap's weight,
         * therefore we use the start weight instead.
         * */
        start: (projectTokenAmount !== poolPTBalance) ? lastSwapWeight : lbpMgr.projectTokenStartWeight,
        end: lbpMgr.projectTokenEndWeight,
      },
      lastSwap.priceUSD, // funding token USD price at last swap
    );

    return forecastData;
  }

  private fetchLastSwap(endDateSeconds: number, startDateSeconds: number, lbpMgr: LbpManager): Promise<ISwapRecord> {
    const uri = this.getBalancerSubgraphUrl();
    const query = {
      swaps: {
        __args: {
          first: 1,
          orderBy: "timestamp",
          orderDirection: "desc",
          where: {
            poolId: lbpMgr.lbp.poolId.toLowerCase(),
            timestamp_gte: startDateSeconds,
            timestamp_lte: endDateSeconds,
          },
        },
        timestamp: true,
        tokenAmountIn: true,
        tokenAmountOut: true,
      },
    };

    return axios.post(uri,
      JSON.stringify({ query: jsonToGraphQLQuery({ query }) }),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0]);
        }

        if (!response.data.data?.swaps?.length) {
          const startFundingTokenAmount = this.numberService.fromString(fromWei(lbpMgr.startingFundingTokenAmount, lbpMgr.fundingTokenInfo.decimals));
          const startProjectTokenAmount = this.numberService.fromString(fromWei(lbpMgr.startingProjectTokenAmount, lbpMgr.projectTokenInfo.decimals));
          return {
            // set the last swap to the start time with pool balance
            timestamp: Math.floor(startDateSeconds / 3600) * 3600,
            tokenAmountOut: startProjectTokenAmount.toString(),
            tokenAmountIn: startFundingTokenAmount.toString(),
          };
        }
        if (response.data.data?.swaps?.length) {
          response.data.data.swaps[0].timestamp = Math.floor(response.data.data.swaps[0].timestamp / 3600) * 3600;
        }
        return response.data?.data.swaps[0];
      })
      .catch((error) => {
        throw new Error(`${error.response?.data?.error.message ?? "Error fetching price history"}`);
        return null;
      });
  }

  private fetchSwaps(endDateSeconds: number, startDateSeconds: number, index, lbp: Lbp): Promise<Array<ISwapRecord>> {
    const uri = this.getBalancerSubgraphUrl();

    const query = {
      swaps: {
        __args: {
          first: 1000,
          skip: 1000 * index,
          orderBy: "timestamp",
          orderDirection: "desc",
          where: {
            poolId: lbp.poolId.toLowerCase(),
            timestamp_gte: startDateSeconds,
            timestamp_lte: endDateSeconds,
          },
        },
        timestamp: true,
        tokenIn: true,
        tokenAmountIn: true,
        tokenAmountOut: true,
      },
    };

    return axios.post(uri,
      JSON.stringify({ query: jsonToGraphQLQuery({ query }) }),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0]);
        }
        return response.data?.data.swaps;
      })
      .catch((error) => {
        throw new Error(`${error.response?.data?.error.message ?? "Error fetching price history"}`);
        return [];
      });
  }

  /**
   * Returns the pool's total swap fees in ETH.
   *
   * @param lbpMgr LbpManager
   */
  public getTotalSwapFees(lbpMgr: LbpManager): Promise<string> {
    if (!lbpMgr.lbp || !lbpMgr.lbp.poolId) {
      return null;
    }

    const poolId = lbpMgr.lbp.poolId;
    const uri = this.getBalancerSubgraphUrl();
    const query = {
      pools: {
        __args: {
          where: {
            id: poolId.toLowerCase(),
          },
        },
        totalSwapFee: true,
      },
    };

    return axios.post(uri,
      JSON.stringify({ query: jsonToGraphQLQuery({ query }) }),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0]);
        }

        return response.data?.data.pools?.[0]?.totalSwapFee;
      })
      .catch((error) => {
        throw new Error(`${error.response?.data?.error.message ?? "Error fetching total swap fee"}`);
        return null;
      });
  }
}
