import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";

enum ERoundDirection {
  "UP",
  "DOWN"
}

@autoinject
export class LbpProjectTokenPriceService {
  private roundedTime(time: Date, roundDirection: ERoundDirection = ERoundDirection.DOWN): moment.Moment {
    if (roundDirection === ERoundDirection.UP) {
      return moment(time).add(60, "minute").startOf("hour");
    }
    return moment(time).startOf("hour");
  }

  private getProjectTokenWeightAtTime(
    current: Date, start: Date, end: Date,
    startWeight: number,
    endWeight: number,
  ): number {
    const hoursPassedSinceStart = this.getHoursPassed(current, start);
    const lbpDurationInHours = moment(end).diff(start, "hours");

    const totalWeightDifference =
      startWeight - endWeight;
    const weightChangePerHour = totalWeightDifference / lbpDurationInHours;
    const weightChange = hoursPassedSinceStart * weightChangePerHour;

    return startWeight - weightChange;
  }

  private getHoursPassed(currentTime: Date, startTime: Date): number {
    const roundedCurrentTime = this.roundedTime(currentTime);
    const roundedStartTime = this.roundedTime(startTime);

    const hoursPassed = moment
      .duration(
        roundedCurrentTime.diff(
          roundedStartTime, "hours",
        ), "hours")
      .asHours();

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
    const roundedEndDate = this.roundedTime(time.end, ERoundDirection.UP);

    const lbpDurationInHours = moment(roundedEndDate).diff(roundedStartDate, "hours");

    const timeInterval = 1;
    const _time = moment(roundedStartDate.toDate());

    for (let hoursPassed = 0; hoursPassed <= lbpDurationInHours; hoursPassed += timeInterval) {
      const projectTokenWeight = this.getProjectTokenWeightAtTime(
        _time.toDate(),
        roundedStartDate.toDate(),
        roundedEndDate.toDate(),
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
        time: Math.floor(_time.startOf("hour").toDate().getTime() / 1000),
      });

      _time.add(timeInterval, "hours");
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
