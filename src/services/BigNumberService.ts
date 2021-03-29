import { BigNumber } from "bignumber.js";

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  DECIMAL_PLACES: 18,
});

export const toBigNumberJs = (n: unknown): BigNumber => new BigNumber(n?.toString());
export default BigNumber;
