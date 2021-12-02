import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";

@autoinject
export class LbpProjectTokenPriceService {
  private roundedTime(time: Date, roundDown = true): Date {
    if (!time) return;
    if (!roundDown) {
      return moment(time).add(60, "minute").startOf("hour").toDate();
    }
    return moment(time).startOf("hour").toDate();
  }

  /**
   * Return the LBP weight at a given time point
   * @param time The time inquired for a specific weight (Date)
   * @param start LBP's start-date (Date)
   * @param end LBP's end-date (Date)
   * @param startWeight LBP's start-weight (number)
   * @param endWeight LBP's end-weight (number)
   * @returns Weight 0.02 - 0.98 (number)
   */
  public getProjectTokenWeightAtTime(
    time: Date,
    start: Date,
    end: Date,
    startWeight: number,
    endWeight: number,
  ): number {
    const hoursPassedSinceStart = this.getHoursPassed(time, start);
    const lbpDurationInHours = Math.floor((end.getTime() - start.getTime()) / 60 / 60 / 1000);

    const totalWeightDifference =
      startWeight - endWeight;
    const weightChangePerHour = totalWeightDifference / lbpDurationInHours;
    const weightChange = hoursPassedSinceStart * weightChangePerHour;

    return startWeight - weightChange;
  }

  private getHoursPassed(currentTime: Date, startTime: Date): number {
    const roundedCurrentTime = this.roundedTime(currentTime);
    const roundedStartTime = this.roundedTime(startTime);
    const hoursPassed = Math.floor((roundedCurrentTime?.getTime() - roundedStartTime?.getTime()) / 1000 / 60 / 60);

    if (hoursPassed < 0) {
      return 0;
    } else {
      return hoursPassed;
    }
  }

  /**
   * Returns the project token price in terms of funding tokens
   *
   * ```ts
   * (Amount of Project Tokens / Amount of Funding Tokens)
   * X
   * (Start Weight Funding / Start Weight Project)
   * =
   * Project Token Price in terms of Funding Tokens (Ratio)
   * ```
   *
   * @param projectTokenInPool Amount of project tokens in pool (In Units).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Units).
   * @param projectTokenWeight Current weight of the project token (Number 0 > n > 1).
   */
  public getProjectPriceRatio(
    projectTokenInPool: number, // units of project tokens in the pool
    fundingTokenInPool: number, // units of funding tokens in the pool
    projectTokenWeight: number,
  ): number {
    const a = (projectTokenInPool) / (fundingTokenInPool);
    const b = (1 - projectTokenWeight) / projectTokenWeight;
    if (b === Infinity) return a;

    return a * b;
  }

  /**
   * Returns the Market Cap at a specific weight in USD.
   *
   * @param projectTokenMaxSupply Max supply of project tokens (BigNumber).
   * @param projectTokenInPool Amount of project tokens in pool (In Units).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Units).
   * @param projectTokenWeight Current weight of the project token (Number 0 > n > 1).
   * @param pricePerFundingToken Current USD price of a funding token (Number).
   */
  public getMarketCap(
    projectTokenMaxSupply: number,
    projectTokenInPool: number,
    fundingTokenInPool: number,
    projectTokenWeight: number,
    pricePerFundingToken: number,
  ): number {
    if (projectTokenWeight >= 1) return undefined;

    const priceAtWeight =
      this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        pricePerFundingToken,
      );

    const projectTokenMarketCap = projectTokenMaxSupply * priceAtWeight;
    return projectTokenMarketCap>= 0 ? projectTokenMarketCap : -1;
  }

  /**
   * Returns the project token price at a specific weight in USD.
   *
   * @param projectTokenInPool Amount of project tokens in pool (In Units).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Units).
   * @param projectTokenWeight Current weight of the project token (Number 0 > n > 1).
   * @param pricePerFundingToken Current USD price of a funding token (Number).
   */
  public getPriceAtWeight(
    projectTokenInPool: number,
    fundingTokenInPool: number,
    projectTokenWeight: number,
    pricePerFundingToken: number,
  ): number {
    if (projectTokenWeight >= 1) return undefined;
    if (projectTokenInPool <= 0 || fundingTokenInPool <= 0) return undefined;

    // this is the number of project tokens that can be purchased  with the current funding tokens in the pool
    // before accounting to the weight
    const fundingTokenValue = fundingTokenInPool * pricePerFundingToken;
    // extract the project token weight from the total pool value
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    // actual project token value
    const projectTokenValue = scalingFactor * fundingTokenValue;
    const pricePerProjectToken = projectTokenValue / projectTokenInPool;

    return pricePerProjectToken; // USD
  }

  /**
   * Returns an Array of predicted project token prices (USD) Cap at the specified time range.
   *
   * @param projectTokenInPool Amount of project tokens in pool (In Units).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Units).
   * @param time The start and end date of the LBP {start: Date, end: Date}.
   * @param weight The start and end weight of the project token {start: (Number 0 > n > 1), end: (Number 0 > n > 1)}.
   * @param pricePerFundingToken Current USD price of a funding token (Number).
   * @returns Array<{price: number, time: number}>
   */
  public getInterpolatedPriceDataPoints(
    projectTokenInPool: number,
    fundingTokenInPool: number,
    time: { start: Date, end: Date },
    weight: { start: number, end: number },
    pricePerFundingToken: number,
  ): Array<{price: number, time: number}> {
    const trajectoryData = [];

    const roundedStartDate = this.roundedTime(time.start);
    const roundedEndDate = this.roundedTime(time.end, false);
    const lbpDurationInHours = moment(roundedEndDate).diff(roundedStartDate, "hours");

    const timeInterval = 1;
    let _time = roundedStartDate;

    for (let hoursPassed = 0; hoursPassed <= lbpDurationInHours + 1; hoursPassed += timeInterval) {

      const projectTokenWeight = this.getProjectTokenWeightAtTime(
        _time,
        roundedStartDate,
        roundedEndDate,
        weight.start,
        weight.end,
      );

      const currentProjectTokenPrice = this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        pricePerFundingToken,
      );

      trajectoryData.push({
        price: currentProjectTokenPrice,
        time: Math.floor((_time.getTime() - 60 * 60 * 1000) / 1000),
      });

      _time = new Date(_time.getTime() + 60 * 60 * 1000);
    }
    return trajectoryData;
  }

  // public getFundsRaised(
  //   initialFundingTokenAmount: BigNumber,
  //   currentFundingTokenAmount: BigNumber, // TODO: Where does this value come from? (Contracts?, TheGraph?)
  //   pricePerFundingToken: number,
  // ): BigNumber {
  //   return BigNumber.from(
  //     toBigNumberJs(
  //       toBigNumberJs(initialFundingTokenAmount)
  //         .minus(toBigNumberJs(currentFundingTokenAmount)),
  //     ).multipliedBy(pricePerFundingToken).toString(),
  //   );
  // }
}
