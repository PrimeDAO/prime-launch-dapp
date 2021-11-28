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
  tokenAmountIn: string,
  tokenAmountOut: string,
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
  ) {
  }

  private getBalancerSubgraphUrl(): string {
    return `https://api.thegraph.com/subgraphs/name/balancer-labs/balancer${EthereumService.targetedNetwork === Networks.Rinkeby ? "-rinkeby-v2" : "-v2"}`;
  }

  private getCoingeckoUrl(fundingTokenId: string, startTime: number, endTime: number): string {
    return `https://api.coingecko.com/api/v3/coins/${fundingTokenId}/market_chart/range?vs_currency=usd&from=${startTime}&to=${endTime}`;
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
    if (!lbpMgr.lbp || !lbpMgr.lbp.poolId) {
      return [];
    }

    const startingSeconds = this.dateService.translateLocalToUtc(lbpMgr.startTime).getTime() / 1000;
    const intervalMinutes = 60/*min*/;
    const intervalSeconds = intervalMinutes * 60/* sec */;
    const roundedStartTime = (Math.floor(startingSeconds / intervalSeconds) * intervalSeconds)/* Rounded */;
    const endTime = lbpMgr.endTime;
    const currentTime = new Date();
    /* Rounded to the nearest hour */
    const endTimeSeconds = Math.floor(
      this.dateService.translateLocalToUtc(
        endTime.getTime() <= currentTime.getTime() ? endTime : currentTime,
      ).getTime() / 1000 / intervalSeconds,
    ) * intervalSeconds + intervalSeconds; // rounded hour


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
      fetched = await this.fetchSwaps(endTimeSeconds, startingSeconds, index, lbpMgr.lbp);
      swaps = swaps.concat(fetched);
      index++;
    } while (fetched.length === 1000);

    const returnArray = new Array<IHistoricalPriceRecord>();

    const startFundingTokenAmount = this.numberService.fromString(fromWei(lbpMgr.startingFundingTokenAmount, lbpMgr.fundingTokenInfo.decimals));
    const startProjectTokenAmount = this.numberService.fromString(fromWei(lbpMgr.startingProjectTokenAmount, lbpMgr.projectTokenInfo.decimals));

    this.lastSwap = {
      timestamp: roundedStartTime,
      tokenAmountIn: (startFundingTokenAmount / (1 - lbpMgr.projectTokenStartWeight)).toString(),
      tokenAmountOut: (startProjectTokenAmount / (lbpMgr.projectTokenStartWeight)).toString(),
    };
    swaps.push({...this.lastSwap});


    if (swaps.length) {
      let previousTimePoint;

      swaps.reverse(); // to ascending

      const prices = await axios.get(
        this.getCoingeckoUrl(
          lbpMgr.fundingTokenInfo.id,
          swaps[0].timestamp - Math.round(60 / intervalMinutes * 1000/*hour back*/),
          endTimeSeconds,
        ),
      );

      const fundingTokenPricesUSD = prices?.data?.prices?.map(price => {
        return {
          timestamp: Math.floor(price[0] / (intervalSeconds * 1000)) * (intervalSeconds),
          priceInUSD: price[1],
        };
      }) || [{ timestamp: 0, priceInUSD: 0 }];

      /**
       * enumerate every day
       */
      for (let timestamp = roundedStartTime; timestamp <= endTimeSeconds - intervalSeconds; timestamp += intervalSeconds) {

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

        const priceAtTimePoint = fundingTokenPricesUSD.filter(price => price.timestamp <= timestamp );

        if (todaysSwaps?.length) {
          returnArray.push({
            time: timestamp,
            price: (
              this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) /
              this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut) *
              priceAtTimePoint[priceAtTimePoint.length-1].priceInUSD
            ),
          });

          this.lastSwap = {
            timestamp: timestamp + intervalSeconds,
            tokenAmountOut: todaysSwaps[todaysSwaps.length-1].tokenAmountOut,
            tokenAmountIn: todaysSwaps[todaysSwaps.length-1].tokenAmountIn,
          };
          previousTimePoint = (
            this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) /
            this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut)
          );
        } else if (previousTimePoint) {
          /**
           * previous value effected by USD course change
           */
          if (this.lastSwap.timestamp <= swaps[swaps.length -1]?.timestamp) {
            returnArray.push({
              time: timestamp,
              price: (
                previousTimePoint *
                priceAtTimePoint[priceAtTimePoint.length-1].priceInUSD
              ),
            });
          }
        } else {
          returnArray.push({
            time: timestamp,
          });
        }
      }
    }
    return returnArray;
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
  public getTotalSwapFees(lbpMgr: LbpManager): Promise<number> {
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

        return this.numberService.fromString(response.data?.data.pools?.[0]?.totalSwapFee);
      })
      .catch((error) => {
        throw new Error(`${error.response?.data?.error.message ?? "Error fetching total swap fee"}`);
        return null;
      });
  }
}
