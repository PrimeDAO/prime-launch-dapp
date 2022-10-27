import { autoinject } from "aurelia-framework";
import { BigNumber } from "bignumber.js";
import { BigNumber as EthersBigNumber } from "ethers";
import { fromWei } from "./EthereumService";
import { NumberService } from "./NumberService";

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  DECIMAL_PLACES: 18,
});

export const toBigNumberJs = (n: unknown): BigNumber => new BigNumber(n?.toString());
export default BigNumber;

@autoinject()
export class BigNumberService {
  constructor(private numberService: NumberService) {}

  public min(input: EthersBigNumber[]): EthersBigNumber {

    let minNumber = input[0];

    if (input.length === 1) {
      return input[0];
    }

    if (input.length === 2) {
      minNumber = this.min2(input[0], input[1]);
      return minNumber;
    }


    const first = input[0];
    const second = input[1];
    minNumber = this.min2(first, second);
    const startAtThirdIndex = 2;
    for (let i = startAtThirdIndex; i < input.length; i++) {
      minNumber = (this.min2(minNumber, input[i]));
      minNumber.toString();/*?*/
    }

    return minNumber;
  }

  public min2(first: EthersBigNumber, second: EthersBigNumber): EthersBigNumber {
    if (!first) return EthersBigNumber.from(0);
    if (!second) return EthersBigNumber.from(0);

    if (first.lt(second)) {
      return first;
    }
    return second;
  }

  public divide(
    numerator: EthersBigNumber,
    denominator: EthersBigNumber,
    numeratorDecimals = 18,
    denominatorDecimals = 18,
  ): number {
    if (denominator.lte(0)) return 0;

    const result =
      this.numberService.fromString(fromWei(numerator, numeratorDecimals)) /
      this.numberService.fromString(fromWei(denominator, denominatorDecimals));

    return result;
  }

  public asPercentageToNumber(input: EthersBigNumber): number {
    const inputFromWei = this.numberService.fromString(fromWei(input));
    const percentage = inputFromWei * 100;
    return percentage;
  }

  public fractionAsPercentageToNumber(
    numerator: EthersBigNumber,
    denominator: EthersBigNumber,
    numeratorDecimals = 18,
    denominatorDecimals = 18,
  ): number {
    const fraction = this.divide(numerator, denominator, numeratorDecimals, denominatorDecimals);
    const percentageFraction = fraction * 100;
    return percentageFraction;
  }
}
