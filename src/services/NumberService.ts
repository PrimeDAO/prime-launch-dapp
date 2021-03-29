const numbro = require("numbro");

// export enum RoundingType {
//   Bankers = 1,
//   HalfUp = 2
// }

export class NumberService {
  /**
   * Note this will round up when average==true and lazt significant digit is .5 or higher.
   * @param value
   * @param format
   */
  public toString(value: number | string,
    options?: {
      precision?: string | number,
      average?: boolean,
      mantissa?: string | number,
      thousandSeparated?: boolean
    },
  ): string | null | undefined {

    // this helps to display the erroneus value in the GUI
    if ((typeof value === "string") || (value === null) || (typeof value === "undefined")) {
      return value as any;
    }

    if (Number.isNaN(value)) {
      return null;
    }
    return numbro(value).format(
      Object.assign(
        { average: !!options?.average },
        { thousandSeparated: !!options?.thousandSeparated },
        Number(options?.precision) ? { totalLength: this.fromString(options.precision) } : {},
        options.mantissa !== undefined ? { mantissa: this.fromString(options.mantissa) } : undefined,
      ) );
  }

  /**
   * returns number with `digits` number of digits.
   * @param value the value
   * @param precision Round to the given precision
   * @param exponentialAt Go exponential at the given magnitude, or low and high values
   * @param roundUp 0 to round up, 1 to round down
   */
  // public toFixedNumberString(
  //   value: string | number,
  //   precision = 5,
  //   exponentialAt: number | [number, number] = [-7, 20],
  //   roundUp = false): string | null | undefined {

  //   if ((value === null) || (value === undefined)) {
  //     return value as any;
  //   }

  //   if ((value.toString().trim() === "") || Number.isNaN(Number(value))) {
  //     return undefined;
  //   }

  //   const bnClone = BN.clone({ EXPONENTIAL_AT: exponentialAt });
  //   /**
  //    * value may be a number or a string
  //    * because we're using BigNumber.js it can be a fixed number
  //    *
  //    * ethers BigNumber doesn't accept fixed point except when converting ETH to WEI.
  //    */
  //   const bn = new bnClone(value.toString());

  //   const result = bn.toPrecision(precision, roundUp ? 0 : 1);

  //   return result;
  // }

  public fromString(value: string | number, decimalPlaces = 1000): number {

    if (typeof(value) === "number") return value;

    // this helps to display the erroneus value in the GUI
    if (!this.stringIsNumber(value, decimalPlaces)) {
      return value as any;
    }

    if (value && value.match(/^\.0{0,}$/)) {
      /**
       * numeral returns `null` for stuff like '.', '.0', '.000', etc
       */
      return 0;
    } else {
      return numbro.unformat(value);
    }
  }

  /**
   * returns whether string represents a number.  can have commas and a decimal
   * (note decimal is not allowed if decimalPlaces is 0)
   * default number of decimmals is basically unlimited
   * @param value
   */
  public stringIsNumber(value?: string | number, decimalPlaces = 1000): boolean {

    if (typeof value === "number") { return true; }

    if ((value === null) || (value === undefined)) { return false; }

    value = value.trim();

    const regex = new RegExp(this.getNumberRegexString(decimalPlaces));
    return regex.test(value);
  }

  // public round(value: number, decimals: number, type: RoundingType): number {
  //   return type === RoundingType.Bankers ? this.roundBankers(value, decimals) : this.roundHalfUp(value, decimals);
  // }

  // public roundHalfUp(value: number, decimals: number): number {
  //   return ((value !== null) && (value !== undefined)) ? this._halfUpRound(value, decimals) : value;
  // }

  // public roundBankers(value: number, decimals: number): number {
  //   return ((value !== null) && (value !== undefined)) ? this._bankersRound(value, decimals) : value;
  // }

  // private _bankersRound(num: number, decimals: number) {
  //   const d = decimals || 0;
  //   const m = Math.pow(10, d);
  //   const n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
  //   const i = Math.floor(n);
  //   const f = n - i;
  //   const e = 1e-8; // Allow for rounding errors in f
  //   const r = (f > 0.5 - e && f < 0.5 + e) ? ((i % 2 === 0) ? i : i + 1) : Math.round(n);
  //   return d ? r / m : r;
  // }

  // // up if .5 or higher, otherwise down
  // private _halfUpRound(num: number, decimals: number) {
  //   const pow = Math.pow(10, (decimals) ? Math.abs(decimals) : 0);
  //   return Math.round(num * pow) / pow;
  // }

  // /**
  //    * >= 1,000,000,000,000 => "T"
  //    * >= 1,000,000,000     => "B"
  //    * >= 1,000,000         => "M"
  //    * >= 1,000             => "K"
  //    * @param num
  //    */
  // public magnitudeLabel(num: number | string): string {
  //   if ((num === undefined) || (num === null) || Number.isNaN(num)) {
  //     return "";
  //   }

  //   if (typeof num === "string") {
  //     num = this.fromString(num);
  //   }

  //   if (num > 1000) {
  //     return "";
  //   }

  //   return (num >= 1000000000000) ? "T" :
  //     (num >= 1000000000) ? "B" :
  //       (num >= 1000000) ? "M" : "K";
  // }

  private getNumberRegexString(decimalPlaces = 0) {
    return (decimalPlaces !== 0) ?
      // tslint:disable-next-line: max-line-length
      `^[+|-]?(((\\d{1,3}\\,)((\\d{3}\\,)?)(\\d{3}?(\\.\\d{0,${decimalPlaces}})?))|(\\d{1,})|(\\d{0,}(\\.\\d{0,${decimalPlaces}})))$` :
      "^[+|-]?(((\\d{1,3}\\,)((\\d{3}\\,)?)(\\d{3}))|(\\d{1,}))$";
  }
}
