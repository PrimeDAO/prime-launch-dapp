import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
import BigNumber from "bignumber.js";
import { toBigNumberJs } from "services/BigNumberService";

@autoinject
export class LbpProjectTokenPriceService {

  constructor(
    private maxProjectTokenSupply: number,
    private fundingTokenAmount: BigNumber,
    private startWeightProjectToken: number,
    private endWeightProjectToken: number,
    private pricePerFundingToken: BigNumber,
  ) {
    this.maxProjectTokenSupply = maxProjectTokenSupply;
    this.fundingTokenAmount = toBigNumberJs(fundingTokenAmount);
    this.startWeightProjectToken = startWeightProjectToken;
    this.endWeightProjectToken = endWeightProjectToken;
    this.pricePerFundingToken = pricePerFundingToken;
  }

  getMarketCap(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    projectTokenWeight: number,
  ): BigNumber {
    const projectTokenMcap =
      this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        this.pricePerFundingToken,
      ).multipliedBy(this.maxProjectTokenSupply);

    return projectTokenMcap.decimalPlaces(2, BigNumber.ROUND_DOWN);
  }

  getPriceAtWeight(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    projectTokenWeight: number,
    pricePerFundingToken: BigNumber,
  ): BigNumber {
    const fundingTokenValue = fundingTokenInPool.multipliedBy(pricePerFundingToken);
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    const projectTokenValue = toBigNumberJs(scalingFactor).multipliedBy(fundingTokenValue);
    const pricePerProjectToken = projectTokenValue.dividedBy(projectTokenInPool);

    return pricePerProjectToken;
  }

  getInterpolatedPriceDataPoints(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    startTime: Date,
    endTime: Date,
  ): { prices, labels} {
    const prices = [];
    const labels = [];

    const roundedStartDate = moment(startTime).startOf("hour");
    const roundedEndDate = moment(endTime).startOf("hour");
    const currentTime = moment(new Date()).startOf("hour").toDate();

    const lbpDurationInHours = moment(roundedEndDate).diff(roundedStartDate, "hours");

    console.log({
      start: roundedStartDate.format("DD-MM-YYYY hh:mm"),
      currentTime: moment(currentTime).format("DD-MM-YYYY hh:mm"),
      end: roundedEndDate.format("DD-MM-YYYY hh:mm"),
      lbpDurationInHours: lbpDurationInHours,
    });

    const hoursPassedSinceStart = this.getHoursPassed(currentTime, roundedStartDate.toDate());
    const hoursLeft = (lbpDurationInHours - hoursPassedSinceStart);

    console.log({hoursLeft, hoursPassedSinceStart});

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

    for (let hoursPassed = 0; hoursPassed < hoursLeft; hoursPassed+=timeInterval) {
      const time = moment(currentTime).add(hoursPassed, "hours");
      const projectTokenWeight = this.getProjectTokenWeightAtTime(
        time.toDate(),
        currentTime,
      );
      const currentProjectTokenPrice = this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        this.pricePerFundingToken,
      );

      labels.push(time.startOf("hour"));
      prices.push(currentProjectTokenPrice);
    }

    return { prices, labels };
  }

  getProjectTokenWeightAtTime(currentTime: Date, startTime: Date): number {
    const hoursPassedSinceStart = this.getHoursPassed(currentTime, startTime);
    const lbpDurationInHours = moment(currentTime).diff(startTime, "hours");

    const totalWeightDifference =
      this.startWeightProjectToken - this.endWeightProjectToken;
    const weightChangePerHour = totalWeightDifference / lbpDurationInHours;
    const weightChange = hoursPassedSinceStart * weightChangePerHour;

    return this.startWeightProjectToken - weightChange;
  }

  getHoursPassed(currentTime: Date, startTime: Date): number {
    const roundedCurrentTime = moment(currentTime).startOf("hour");
    const roundedStartTime = moment(startTime).startOf("hour");

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
