import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
import Moment = moment.Moment;

@autoinject
export class LbpProjectTokenPriceService {

  maxSupply: number;
  projectTokenInitialLbpAmount: number;
  fundingTokenInitialLbpAmount: number;
  startWeightProjectToken: number;
  endWeightProjectToken: number;
  startDate: string;
  endDate: string;
  roundedStartDate: Moment;
  roundedEndDate: Moment;
  lbpDurationInHours: number;
  pricePerFundingToken: number;


  constructor(
    maxSupply: number,
    projectTokenInitialLbpAmount: number,
    fundingTokenInitialLbpAmount: number,
    startWeightProjectToken: number,
    endWeightProjectToken: number,
    startDate: string,
    endDate: string,
    pricePerFundingToken: number,
  ) {
    this.maxSupply = maxSupply;
    this.projectTokenInitialLbpAmount = projectTokenInitialLbpAmount;
    this.fundingTokenInitialLbpAmount = fundingTokenInitialLbpAmount;
    this.startWeightProjectToken = startWeightProjectToken;
    this.endWeightProjectToken = endWeightProjectToken;
    this.startDate = startDate;
    this.endDate = endDate;
    this.roundedStartDate = moment(this.startDate).startOf("hour");
    this.roundedEndDate = moment(this.endDate).startOf("hour");
    this.lbpDurationInHours = moment(this.roundedEndDate).diff(this.roundedStartDate, "hours");
    this.pricePerFundingToken = pricePerFundingToken;
  }

  getMarketCap(
    projectTokenInPool: number,
    fundingTokenInPool: number,
    projectTokenWeight: number,
  ): number {
    const projectTokenMcap =
      this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        this.pricePerFundingToken,
      ) *
      this.maxSupply;


    return Math.round(projectTokenMcap);
  }

  getPriceAtWeight(
    projectTokenInPool: number,
    fundingTokenInPool: number,
    projectTokenWeight: number,
    pricePerFundingToken: number,
  ): number {
    const fundingTokenValue = fundingTokenInPool * pricePerFundingToken;
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    const projectTokenValue = scalingFactor * fundingTokenValue;
    const pricePerProjectToken = projectTokenValue / projectTokenInPool;

    return pricePerProjectToken;
  }

  getInterpolatedPriceDataPoints(
    projectTokenInPool: number,
    fundingTokenInPool: number,
    currentTime: Date,
  ): { prices, labels} {
    const prices = [];
    const labels = [];

    const hoursPassedSinceStart = this.getHoursPassed(currentTime);
    const hoursLeft = (this.lbpDurationInHours - hoursPassedSinceStart);

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

  getProjectTokenWeightAtTime(currentTime: Date): number {
    const hoursPassedSinceStart = this.getHoursPassed(currentTime);

    const totalWeightDifference =
      this.startWeightProjectToken - this.endWeightProjectToken;
    const weightChangePerHour = totalWeightDifference / this.lbpDurationInHours;
    const weightChange = hoursPassedSinceStart * weightChangePerHour;

    return this.startWeightProjectToken - weightChange;
  }

  getHoursPassed(currentTime: Date): number {
    const roundedCurrentTime = moment(currentTime).startOf("hour");
    return moment
      .duration(
        roundedCurrentTime.diff(
          this.roundedStartDate, "hours",
        ), "hours")
      .asHours();
  }

  getFundsRaised(fundingTokenInPool: number): number {
    return (
      (fundingTokenInPool - this.fundingTokenInitialLbpAmount) *
      this.pricePerFundingToken
    );
  }
}
