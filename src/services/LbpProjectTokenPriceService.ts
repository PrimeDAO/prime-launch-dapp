import { autoinject } from "aurelia-framework";
import * as moment from "moment-timezone";
import { BigNumber } from "ethers";
import { toBigNumberJs } from "services/BigNumberService";

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

  public getMarketCap(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    maxProjectTokenSupply: BigNumber,
    projectTokenWeight: number,
    pricePerFundingToken: number,
  ): BigNumber {
    if (projectTokenWeight >= 1) return undefined;

    const priceAtWeight =
      this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        pricePerFundingToken,
      );

    const projectTokenMcap = priceAtWeight.mul(maxProjectTokenSupply);

    return projectTokenMcap;
  }

  public getPriceAtWeight(
    projectTokenInPool: BigNumber, // amount of project tokens in the pool
    fundingTokenInPool: BigNumber, // amount of funding tokens in the pool
    projectTokenWeight: number,
    pricePerFundingToken: number, // the current USD price of a funding token
  ): BigNumber {
    if (projectTokenWeight >= 1) return undefined;

    // this is the number of project tokens that can be purchased  with the current funding tokens in the pool
    // before accounting to the weight
    const fundingTokenValue = toBigNumberJs(fundingTokenInPool.toString()).multipliedBy(pricePerFundingToken);
    const scalingFactor = projectTokenWeight / (1 - projectTokenWeight);
    // actual project token value
    const projectTokenValue = toBigNumberJs(scalingFactor).multipliedBy(fundingTokenValue);
    const pricePerProjectToken = projectTokenValue.dividedBy(toBigNumberJs(projectTokenInPool));

    return BigNumber.from(pricePerProjectToken); // usd
  }

  public getInterpolatedPriceDataPoints(
    projectTokenInPool: BigNumber,
    fundingTokenInPool: BigNumber,
    startTime: Date,
    endTime: Date,
    startWeight: number,
    endWeight: number,
    pricePerFundingToken: number,
  ): { prices, labels} {
    const prices = [];
    const labels = [];

    const roundedStartDate = this.roundedTime(startTime);
    const roundedEndDate = this.roundedTime(endTime);
    const currentTime = this.roundedTime(new Date()).toDate();

    const lbpDurationInHours = moment(roundedEndDate).diff(roundedStartDate, "hours");

    const hoursPassedSinceStart = this.getHoursPassed(currentTime, roundedStartDate.toDate());
    const hoursLeft = (lbpDurationInHours - hoursPassedSinceStart);

    const timeInterval = this.getInterval(hoursLeft);

    const time = moment(roundedStartDate.toDate());

    for (let hoursPassed = 0; hoursPassed <= hoursLeft; hoursPassed+=timeInterval) {
      const projectTokenWeight = this.getProjectTokenWeightAtTime(
        time.toDate(),
        roundedStartDate.toDate(),
        roundedEndDate.toDate(),
        startWeight,
        endWeight,
      );

      const currentProjectTokenPrice = this.getPriceAtWeight(
        projectTokenInPool,
        fundingTokenInPool,
        projectTokenWeight,
        pricePerFundingToken,
      );

      labels.push(time.startOf("hour"));
      prices.push(currentProjectTokenPrice);

      time.add(timeInterval, "hours");
    }

    return { prices, labels };
  }

  /* needs clarifications */
  // public getFundsRaised(fundingTokenInPool: BigNumber): BigNumber {
  //   return toWei(
  //     toBigNumberJs(
  //       toBigNumberJs(fundingTokenInPool)
  //         .minus(toBigNumberJs(this.fundingTokenAmount)),
  //     ).multipliedBy(this.pricePerFundingToken).toString());
  // }
}
