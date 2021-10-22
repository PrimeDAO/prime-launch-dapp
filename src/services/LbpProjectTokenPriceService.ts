import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
// import BigNumber from "bignumber.js";
import BigNumber, { toBigNumberJs } from "services/BigNumberService";
@autoinject
export class LbpProjectTokenPriceService {

  constructor(
    private maxProjectTokenSupply: number,
    private fundingTokenAmount: BigNumber,
    private startWeightProjectToken: number,
    private endWeightProjectToken: number,
    private pricePerFundingToken: number,
  ) {
    this.maxProjectTokenSupply = maxProjectTokenSupply;
    this.fundingTokenAmount = fundingTokenAmount;
    this.startWeightProjectToken = startWeightProjectToken;
    this.endWeightProjectToken = endWeightProjectToken;
    this.pricePerFundingToken = pricePerFundingToken;
  }

  getMarketCap(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    projectTokenWeight: number,
  ): BigNumber {
    if (projectTokenWeight >= 1) return undefined;

    const priceAtWeight =
      this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        this.pricePerFundingToken,
      );

    const projectTokenMcap =
      priceAtWeight?.multipliedBy(this.maxProjectTokenSupply);

    return projectTokenMcap.decimalPlaces(2, BigNumber.ROUND_DOWN);
  }

  getPriceAtWeight(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    projectTokenWeight: number,
    pricePerFundingToken: number,
  ): BigNumber {
    if (projectTokenWeight >= 1) return undefined;

    const fundingTokenValue = fundingTokenInPool.multipliedBy(pricePerFundingToken);
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    const projectTokenValue = toBigNumberJs(scalingFactor).multipliedBy(fundingTokenValue);
    const pricePerProjectToken = projectTokenValue.dividedBy(projectTokenInPool);

    return pricePerProjectToken;
  }

  roundedTime(time: Date): moment.Moment {
    return moment(time).startOf("hour");
  }

  getInterpolatedPriceDataPoints(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    startTime: Date,
    endTime: Date,
  ): { prices, labels} {
    const prices = [];
    const labels = [];

    const roundedStartDate = this.roundedTime(startTime);
    const roundedEndDate = this.roundedTime(endTime);
    const currentTime = this.roundedTime(new Date()).toDate();

    const lbpDurationInHours = moment(roundedEndDate).diff(roundedStartDate, "hours");

    const hoursPassedSinceStart = this.getHoursPassed(currentTime, roundedStartDate.toDate());
    const hoursLeft = (lbpDurationInHours - hoursPassedSinceStart);


    let timeInterval: number;
    if (hoursLeft >= 24 * 20 /* days */) {
      timeInterval = 24;
    } else if (hoursLeft >= 24 * 10 /* days */) {
      timeInterval = 12;
    } else if (hoursLeft >= 24 * 4 /* days */) {
      timeInterval = 4;
    } else {
      timeInterval = 1;
    }

    const time = moment(roundedStartDate.toDate());

    for (let hoursPassed = 0; hoursPassed <= hoursLeft; hoursPassed+=timeInterval) {
      const projectTokenWeight = this.getProjectTokenWeightAtTime(
        time.toDate(),
        roundedStartDate.toDate(),
        roundedEndDate.toDate(),
      );

      const currentProjectTokenPrice = this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        this.pricePerFundingToken,
      );

      labels.push(time.startOf("hour"));
      prices.push(currentProjectTokenPrice);

      time.add(timeInterval, "hours");
    }

    return { prices, labels };
  }

  getProjectTokenWeightAtTime(
    current: Date, start: Date, end: Date,
    startWeight: number = this.startWeightProjectToken,
    endWeight: number = this.endWeightProjectToken,
  ): number {
    const hoursPassedSinceStart = this.getHoursPassed(current, start);
    const lbpDurationInHours = moment(end).diff(start, "hours");

    const totalWeightDifference =
      startWeight - endWeight;
    const weightChangePerHour = totalWeightDifference / lbpDurationInHours;
    const weightChange = hoursPassedSinceStart * weightChangePerHour;

    return startWeight - weightChange;
  }

  getHoursPassed(currentTime: Date, startTime: Date): number {
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

  /* needs clarifications */
  getFundsRaised(fundingTokenInPool: BigNumber): BigNumber {
    return (
      (fundingTokenInPool.minus(this.fundingTokenAmount))
        .multipliedBy(this.pricePerFundingToken)
    );
  }
}
