import { EthereumService, Networks } from "services/EthereumService";
import { Lbp } from "entities/Lbp";

import { DateService } from "services/DateService";
import { NumberService } from "services/NumberService";
import { TokenService } from "services/TokenService";
import { ITokenInfo } from "services/TokenTypes";
import { LbpProjectTokenPriceService } from "./LbpProjectTokenPriceService";

import { jsonToGraphQLQuery } from "json-to-graphql-query";
import axios from "axios";
import { autoinject } from "aurelia-framework";

interface ISwapRecord {
  timestamp: number,
  poolLiquidity: string,
  tokenInSym: string,
  tokenAmountIn: string,
  tokenOut: string,
  tokenAmountOut: string,
}

interface IHistoricalPriceRecord { time: number, value?: number }

@autoinject
export class GetProjectTokenHistoricalPriceService {
  private historicalPrices = new Array<IHistoricalPriceRecord>();
  private dateService = new DateService();
  private tokenService: TokenService;
  private lbpProjectTokenPriceService = new LbpProjectTokenPriceService();

  constructor(
    private ethereumService: EthereumService,
    private lbp: Lbp,
    private numberService: NumberService,
    private address: string,
    private fundingTokenInfo: ITokenInfo,
  ) {
    this.address = lbp.poolId.toLowerCase();
  }

  private getBalancerSubgraphUrl(): string {
    return `https://api.thegraph.com/subgraphs/name/balancer-labs/balancer${this.ethereumService.targetedNetwork === Networks.Rinkeby ? "-rinkeby-v2" : "-v2"}`;
  }

  private getCoingeckoUrl(fundingTokenId: string, startTime: number, endTime: number): string {
    return `https://api.coingecko.com/api/v3/coins/${fundingTokenId}/market_chart/range?vs_currency=usd&from=${startTime}&to=${endTime}`;
  }

  public async getPricesHistory(startTime: Date): Promise<Array<IHistoricalPriceRecord>> {
    if (!this.lbp || !this.lbp.poolId) {
      return [];
    }

    const startingSeconds = startTime.getTime() / 1000;
    const hourSeconds = 60/*min*/ * 60/*sec*/;

    /* Rounded to the nearest hour */
    const endTimeSeconds = Math.ceil(new Date().getTime() / hourSeconds / 1000) * hourSeconds; // rounded hour
    console.log({startingSeconds, endTimeSeconds});

    /**
     * subgraph will return a maximum of 1000 records at a time.  so for a very active pool,
     * in a single query you can potentially obtain data for only a small slice of calendar time.
     *
     * So we fetch going backwards from today, 1000 at a time, until we've got all the records.
     */
    let swaps = new Array<ISwapRecord>();
    let fetched: Array<ISwapRecord>;
    do {
      /**
       * fetchSwaps returns swaps in descending time order, so the last one will be
       * the earliest one.
       */
      const endDateSeconds = swaps.length ? swaps[swaps.length-1].timestamp : endTimeSeconds;
      fetched = await this.fetchSwaps(endDateSeconds, startingSeconds);
      swaps = swaps.concat(fetched);
    } while (fetched.length === 1000);

    const returnArray = new Array<IHistoricalPriceRecord>();

    if (swaps.length) {
      let previousDay;

      const prices = await axios.get(
        this.getCoingeckoUrl(
          this.fundingTokenInfo.id,
          swaps[0].timestamp,
          endTimeSeconds,
        ),
      );
      const fundingTokenPricesUSD = await prices.data.prices.map(price => {
        return {
          time: Math.floor(price[0] / (hourSeconds * 1000)) * (hourSeconds),
          value: price[1],
        };
      });

      swaps.reverse(); // to ascending
      /**
       * enumerate every day
       */

      // let latestPrice = 0;
      // let swapIndex = 0;
      // const amounts = {
      //   in: 0,
      //   out: 0,
      // };

      // fundingTokenPricesUSD.forEach(price => {

      //   console.log({swapIndex}, {price});
      //   if (swapIndex <= swaps.length - 1 && price.time >= swaps[swapIndex].timestamp) {
      //     amounts.in = parseFloat(swaps[swapIndex].tokenAmountIn);
      //     amounts.out = parseFloat(swaps[swapIndex].tokenAmountOut);
      //     console.log(new Date(swaps[swapIndex].timestamp * 1000), {amounts});

      //     swapIndex++;
      //   }

      //   latestPrice = this.lbpProjectTokenPriceService.getProjectPriceRatio(
      //     amounts.in, // funding token (e.g. usdc)
      //     amounts.out, // project token (e.g. prime)
      //     0.5, // funding token price
      //   ) * price.value;

      //   price.value = latestPrice;
      // });

      for (let timestamp = Math.floor(swaps[0].timestamp / hourSeconds ) * hourSeconds; timestamp <= endTimeSeconds; timestamp += hourSeconds) {

        const todaysSwaps = new Array<ISwapRecord>();
        const nextDay = timestamp + hourSeconds;

        if (swaps.length) {
        // eslint-disable-next-line no-constant-condition
          while (true) {
            const swap = swaps[0];
            if (swap.timestamp >= nextDay) {
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

        // let liquidityCurrent: number;
        // let liquidityLast: number;
        // let timeSpan: number;
        if (todaysSwaps?.length) {
          // if (todaysSwaps.length > 1) {
          //   liquidityCurrent = this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) / this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut) * fundingTokenPricesUSD[fundingTokenPricesUSD.length - 1].value; //USD Price
          //   liquidityLast = this.numberService.fromString(todaysSwaps[todaysSwaps.length-2].tokenAmountIn) / this.numberService.fromString(todaysSwaps[todaysSwaps.length-2].tokenAmountOut) * fundingTokenPricesUSD[fundingTokenPricesUSD.length - 2].value; //USD Price
          //   timeSpan = todaysSwaps[todaysSwaps.length-1].timestamp - todaysSwaps[todaysSwaps.length-2].timestamp / 60 / 60;
          // }
          // average
          // const liquidityThisDay = todaysSwaps.reduce((accumulator, currentValue) =>
          //   accumulator + this.numberService.fromString(currentValue.poolLiquidity), 0) / todaysSwaps.length;

          // max
          // const liquidityThisDay = todaysSwaps.reduce((accumulator, currentValue) =>
          //   accumulator = Math.floor(accumulator, this.numberService.fromString(currentValue.poolLiquidity)), 0);

          // closing

          const liquidityThisDay = this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) / this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut) * fundingTokenPricesUSD[fundingTokenPricesUSD.length - 1].value; //USD Price

          returnArray.push({
            time: timestamp,
            value: liquidityThisDay,
          });
          previousDay = liquidityThisDay;
        } else if (previousDay) {
          /**
           * keep the previous value
           */

          // const step = liquidityLast + (liquidityCurrent - liquidityLast) / timeSpan;

          returnArray.push({
            time: timestamp,
          });
        } else {
          returnArray.push({
            time: timestamp,
          });
        }
      }
      // returnArray.push(...fundingTokenPricesUSD);
    }

    return returnArray;
  }

  private fetchSwaps(endDateSeconds: number, startDateSeconds: number): Promise<Array<ISwapRecord>> {
    const uri = this.getBalancerSubgraphUrl();
    const query = {
      swaps: {
        __args: {
          first: 1000,
          orderBy: "timestamp",
          orderDirection: "desc",
          where: {
            poolId: this.lbp.poolId.toLowerCase(),
            timestamp_gte: startDateSeconds,
            timestamp_lte: endDateSeconds,
          },
        },
        timestamp: true,
        tokenInSym: true,
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
        // this.consoleLogService.handleFailure(
        //   new EventConfigFailure(`Pool: Error fetching market cap history: ${error?.response?.data?.error?.message ?? error?.message}`));
        console.log({
          fetchSwapsError: error.message,
          address: this.address,
          id: this.lbp.poolId,
        });

        // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token info"}`);
        // TODO:  restore the exception?
        return [];
      });
  }
}
