import { BigNumber } from "ethers";
import { NumberService } from "services/NumberService";

describe("NumberService.spec", () => {
  const numberService = new NumberService();

  describe("fromString", () => {
    it("fromString", () => {
      numberService.fromString(158.585559, 100000);/*?*/
      numberService.fromString("158.585559", 100000);/*?*/
      numberService.fromString("1", 0);/*?*/
      numberService.fromString(BigNumber.from(5), 100000);/*?*/
    });

    it("toString", () => {
      const input = 1;
      expect(numberService.toString(input, {mantissa: 1})).toBe("1.0");

      /** Guard cases */
      expect(numberService.toString(NaN)).toBe(null);
      expect(numberService.toString(input.toString())).toBe(input.toString());
      expect(numberService.toString(input)).toBe("123.45");

      /** Mantissa */
      expect(numberService.toString(input, {mantissa: -1})).toBe(".4");
      expect(numberService.toString(input, {mantissa: 0})).toBe("123");
      expect(numberService.toString(input, {mantissa: 1})).toBe("123.4");
      expect(numberService.toString(input, {mantissa: 10})).toBe("123.4567890000");

      /** Average */
      expect(numberService.toString(input, {average: true})).toBe("123.45");

      /** ThousandSeparated */
      const thousandInput = 1234.56789;
      expect(numberService.toString(thousandInput, {thousandSeparated: true})).toBe("1,234.56");

      /** Numeral JS */
      const numeralJsBugInput = 0.0000001;
      expect(numberService.toString(numeralJsBugInput, {thousandSeparated: true})).toBe("0.00");
    });

  });
});
