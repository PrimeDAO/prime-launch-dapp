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

    const projectTokenMcap = parseFloat(fromWei(projectTokenMaxSupply, "ether")) * priceAtWeight;
    return projectTokenMcap;
  }

  public getPriceAtWeight(
    projectTokenInPool: BigNumber, // amount of project tokens in the pool
    fundingTokenInPool: BigNumber, // amount of funding tokens in the pool
    projectTokenWeight: number,
    pricePerFundingToken: number, // the current USD price of a funding token
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
