import { BigNumber } from "bignumber.js";
import { BigNumber as EthersBigNumber } from "ethers";

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  DECIMAL_PLACES: 18,
});

export const toBigNumberJs = (n: unknown): BigNumber => new BigNumber(n?.toString());
export default BigNumber;

export class BigNumberService {
  public min(input: EthersBigNumber[]): EthersBigNumber {

    let minNumber = input[0];

    if (input.length === 1) {
      return input[0];
    }

    if (input.length === 2) {
      minNumber = this.min2(input[0], input[1]);
      return minNumber;
    }


    for (let i = 0; i < input.length - 1; i++) {
      const first = input[i];
      const second = input[i+1];
      minNumber = this.min2(first, second);
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
}
