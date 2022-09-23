import { BigNumber } from "ethers";
import { BigNumberService } from "services/BigNumberService";

fdescribe("BigNumberService.spec", () => {
  describe("min", () => {
    const bigNumberService = new BigNumberService();

    it("min2", () => {
      const expected = 1000;
      const first = BigNumber.from(expected);
      const second = BigNumber.from(expected);

      const result = bigNumberService.min2(first, second);
      expect(result.toNumber()).toBe(expected);

      const first_1 = BigNumber.from(expected);
      const second_1 = BigNumber.from(expected * 2);

      const result_1 = bigNumberService.min2(first_1, second_1);
      expect(result_1.toNumber()).toBe(expected);
    });

    it("min", () => {
      const expected = 1000;
      const testInput = [
        BigNumber.from(14000),
        BigNumber.from(21000),
        BigNumber.from(expected),
      ];

      const result = bigNumberService.min(testInput);

      expect(result.toNumber()).toBe(expected);
    });
  });
});
