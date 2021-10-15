import { NumberService } from "services/NumberService";
import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
import Moment = moment.Moment;
import BigNumber from "bignumber.js";
import { toBigNumberJs } from "services/BigNumberService";

@autoinject
export class LbpProjectTokenPriceService {

  projectTokenInitialLbpAmount: BigNumber;
  fundingTokenInitialLbpAmount: BigNumber;
  startWeightProjectToken: number;
  endWeightProjectToken: number;
  startDate: string;
  endDate: string;
  roundedStartDate: Moment;
  roundedEndDate: Moment;
  lbpDurationInHours: number;
  pricePerFundingToken: BigNumber;
  private numberService: NumberService;

  constructor(
    private maxSupply: number,
    projectTokenInitialLbpAmount: BigNumber,
    fundingTokenInitialLbpAmount: BigNumber,
    startWeightProjectToken: number,
    endWeightProjectToken: number,
    startDate: string,
    endDate: string,
    pricePerFundingToken: BigNumber,
  ) {
    this.maxSupply = maxSupply;
    this.projectTokenInitialLbpAmount = toBigNumberJs(projectTokenInitialLbpAmount);
    this.fundingTokenInitialLbpAmount = toBigNumberJs(fundingTokenInitialLbpAmount);
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
      ).multipliedBy(this.maxSupply);

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

  getFundsRaised(fundingTokenInPool: BigNumber): BigNumber {
    return (
      (fundingTokenInPool.minus(this.fundingTokenInitialLbpAmount))
        .multipliedBy(this.pricePerFundingToken)
    );
  }
}
