import { BigNumber } from "ethers";
import { BigNumberService } from "services/BigNumberService";
import { NumberService } from "services/NumberService";

type InputMatrix<Expected = number> = [string, [number | string, number | string], Expected][]
type InputMatrixPercentage<Expected = number> = [string, [string], Expected][]

fdescribe("BigNumberService.spec", () => {
  const numberService = new NumberService();
  const bigNumberService = new BigNumberService(numberService);

  describe("min", () => {

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

    it("min - 1", () => {
      const expected = 1000;
      const testInput = [
        BigNumber.from(14000),
        BigNumber.from(21000),
        BigNumber.from(expected),
      ];

      const result = bigNumberService.min(testInput);

      expect(result.toNumber()).toBe(expected);
    });

    it("min - 2", () => {
      const expected = 5;
      const testInput = [
        BigNumber.from(expected),
        BigNumber.from(10),
        BigNumber.from(572800),
        BigNumber.from(14),
      ];

      const result = bigNumberService.min(testInput);

      expect(result.toNumber()).toBe(expected);
    });
  });

  describe("divide", () => {
    const inputMatrix: InputMatrix = [
      ["divide - 1/2", [1, 2], 0.5],
      ["divide - 1/0", [1, 0], 0],
      ["divide - 1/-2", [1, -2], 0],
      ["divide - 0/2", [0, 2], 0],
      ["fractionAsPercentageToNumber - 0/2", ["6000000000000000000", "20000000000000000000"], 0.3],
      ["fractionAsPercentageToNumber - 0/2", ["20000000000000000000", "6000000000000000000"], 3.3333333333333335],
    ];

    inputMatrix.forEach(([label, [nom, denom], expected]) => {
      it(label, () => {
        const finalNom = BigNumber.from(nom);
        const finalDenom = BigNumber.from(denom);
        const result = bigNumberService.divide(finalNom, finalDenom);
        expect(result).toBe(expected);
      });
    });
  });

  describe("asPercentageToNumber", () => {
    const inputMatrix: InputMatrixPercentage = [
      ["asPercentageToNumber - 0.1", ["100000000000000000"], 10],
      ["asPercentageToNumber - 1", ["1000000000000000000"], 100],
    ];

    inputMatrix.forEach(([label, [input], expected]) => {
      it(label, () => {
        const finalInput = BigNumber.from(input);
        const result = bigNumberService.asPercentageToNumber(finalInput);
        expect(result).toBe(expected);
      });
    });
  });

  describe("fractionAsPercentageToNumber", () => {
    const inputMatrix: InputMatrix = [
      ["fractionAsPercentageToNumber - 1/2", [1, 2], 50],
      ["fractionAsPercentageToNumber - 1/0", [1, 0], 0],
      ["fractionAsPercentageToNumber - 1/-2", [1, -2], 0],
      ["fractionAsPercentageToNumber - 0/2", [0, 2], 0],
      ["fractionAsPercentageToNumber - 0/2", ["6000000000000000000", "20000000000000000000"], 30],
    ];

    inputMatrix.forEach(([label, [nom, denom], expected]) => {
      it(label, () => {
        const finalNom = BigNumber.from(nom);
        const finalDenom = BigNumber.from(denom);
        const result = bigNumberService.fractionAsPercentageToNumber(finalNom, finalDenom);
        expect(result).toBe(expected);
      });
    });
  });
});
