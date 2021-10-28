import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
import { BigNumber } from "ethers";
import { toBigNumberJs } from "services/BigNumberService";
import { fromWei } from "./EthereumService";

@autoinject
export class LbpProjectTokenPriceService {

  private roundedTime(time: Date): moment.Moment {
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

  private getInterval(hoursLeft: number): number {
    if (hoursLeft >= 24 * 20 /* days */) {
      return 24;
    } else if (hoursLeft >= 24 * 10 /* days */) {
      return 12;
    } else if (hoursLeft >= 24 * 4 /* days */) {
      return 4;
    } else {
      return 1;
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
   * @param projectTokenInPool Amount of project tokens in pool (In Wei).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Wei).
   * @param projectTokenWeight Current weight of the project token (Number 0 > n > 1).
   */
  public getProjectPriceRatio(
    projectTokenInPool: BigNumber, // amount of project tokens in the pool
    fundingTokenInPool: BigNumber, // amount of funding tokens in the pool
    projectTokenWeight: number,
  ): number {
    const a = (toBigNumberJs(projectTokenInPool).dividedBy(toBigNumberJs(fundingTokenInPool))).toNumber();
    const b = (1 - projectTokenWeight) / projectTokenWeight;
    if (b === Infinity) return a;

    return parseFloat(((a * b) ).toFixed(2));
  }

  /**
   * Returns the Market Cap at a specific weight in USD.
   *
   * @param projectTokenMaxSupply Max supply of project tokens (BigNumber).
   * @param projectTokenInPool Amount of project tokens in pool (In Wei).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Wei).
   * @param projectTokenWeight Current weight of the project token (Number 0 > n > 1).
   * @param pricePerFundingToken Current USD price of a funding token (Number).
   */
  public getMarketCap(
    projectTokenMaxSupply: BigNumber,
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
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

    const projectTokenMarketCap = parseFloat(fromWei(projectTokenMaxSupply, "ether")) * priceAtWeight;
    return projectTokenMarketCap;
  }

  /**
   * Returns the project token price at a specific weight in USD.
   *
   * @param projectTokenInPool Amount of project tokens in pool (In Wei).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Wei).
   * @param projectTokenWeight Current weight of the project token (Number 0 > n > 1).
   * @param pricePerFundingToken Current USD price of a funding token (Number).
   */
  public getPriceAtWeight(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    projectTokenWeight: number,
    pricePerFundingToken: number,
  ): number {
    if (projectTokenWeight >= 1) return undefined;

    // this is the number of project tokens that can be purchased  with the current funding tokens in the pool
    // before accounting to the weight
    const fundingTokenValue = toBigNumberJs(fundingTokenInPool.toString()).multipliedBy(pricePerFundingToken);
    // extract the project token weight from the total pool value
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    // actual project token value
    const projectTokenValue = toBigNumberJs(scalingFactor).multipliedBy(fundingTokenValue);
    const pricePerProjectToken = projectTokenValue.dividedBy(toBigNumberJs(projectTokenInPool));

    return pricePerProjectToken.toNumber(); // usd
  }

  /**
   * Returns an Array of predicted project token prices (USD) Cap at the specified time range.
   *
   * @param projectTokenInPool Amount of project tokens in pool (In Wei).
   * @param fundingTokenInPool Amount of funding tokens in pool (In Wei).
   * @param time The start and end date of the LBP {start: Date, end: Date}.
   * @param weight The start and end weight of the project token {start: (Number 0 > n > 1), end: (Number 0 > n > 1)}.
   * @param pricePerFundingToken Current USD price of a funding token (Number).
   */
  public getInterpolatedPriceDataPoints(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    time: { start: Date, end: Date },
    weight: { start: number, end: number },
    pricePerFundingToken: number,
  ): { prices, labels} {
    const prices = [];
    const labels = [];

    const roundedStartDate = this.roundedTime(time.start);
    const roundedEndDate = this.roundedTime(time.end);
    const currentTime = this.roundedTime(new Date()).toDate();

    const lbpDurationInHours = moment(roundedEndDate).diff(roundedStartDate, "hours");

    const hoursPassedSinceStart = this.getHoursPassed(currentTime, roundedStartDate.toDate());
    const hoursLeft = (lbpDurationInHours - hoursPassedSinceStart);

    const timeInterval = this.getInterval(hoursLeft);
    const _time = moment(roundedStartDate.toDate());

    for (let hoursPassed = 0; hoursPassed <= hoursLeft; hoursPassed += timeInterval) {
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

      labels.push(_time.startOf("hour"));
      prices.push(currentProjectTokenPrice);

      _time.add(timeInterval, "hours");
    }

    return { prices, labels };
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
