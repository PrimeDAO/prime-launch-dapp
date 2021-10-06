import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
import Moment = moment.Moment;

@autoinject
export class LbpProjectTokenPriceService {

  projectTokenTotalSupply: number;
  projectTokenInitialLbpAmount: number;
  fundingTokenInitialLbpAmount: number;
  startWeightProjectToken: number;
  endWeightProjectToken: number;
  startDate: Date;
  endDate: Date;
  roundedStartDate: Moment;
  roundedEndDate: Moment;
  lbpDurationInHours: number;
  pricePerFundingToken: number;


  constructor(
    projectTokenTotalSupply: number,
    projectTokenInitialLbpAmount: number,
    fundingTokenInitialLbpAmount: number,
    startWeightProjectToken: number,
    endWeightProjectToken: number,
    startDate: Date,
    endDate: Date,
    pricePerFundingToken: number,
  ) {
    this.projectTokenTotalSupply = projectTokenTotalSupply;
    this.projectTokenInitialLbpAmount = projectTokenInitialLbpAmount;
    this.fundingTokenInitialLbpAmount = fundingTokenInitialLbpAmount;
    this.startWeightProjectToken = startWeightProjectToken;
    this.endWeightProjectToken = endWeightProjectToken;
    this.startDate = startDate;
    this.endDate = endDate;
    this.roundedStartDate = moment(this.startDate).startOf("hour");
    this.roundedEndDate = moment(this.endDate).startOf("hour");
    this.lbpDurationInHours = Math.round((this.endDate.getTime() - this.startDate.getTime()) / 36e5);
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
      this.projectTokenTotalSupply;

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

  getInterpolatedPriceDatapoints(
    projectTokenInPool: number,
    fundingTokenInPool: number,
    currentTime: Date,
  ): { prices, labels} {
    const prices = [];
    const labels = [];

    const hoursPassedSinceStart = this.getHoursPassed(currentTime);
    const hoursLeft = this.lbpDurationInHours - hoursPassedSinceStart;

    for (let hoursPassed = 0; hoursPassed < hoursLeft; hoursPassed++) {
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
      .duration(roundedCurrentTime.diff(this.roundedStartDate))
      .asHours();
  }

  getFundsRaised(fundingTokenInPool: number): number {
    return (
      (fundingTokenInPool - this.fundingTokenInitialLbpAmount) *
      this.pricePerFundingToken
    );
  }
}
