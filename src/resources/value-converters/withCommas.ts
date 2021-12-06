import {autoinject} from "aurelia-framework";
import { BigNumber } from "ethers";
import { Utils } from "services/utils";
import { NumberService } from "../../services/NumberService";

/**
 * when a number is retrieved from the element to which it is bound, convert it from a string to a number.
 */
@autoinject
export class WithCommasValueConverter {

  constructor(private numberService: NumberService) { }

  public fromView(value: string): string {
    return Utils.replaceAll(value, ",", "");
  }

  public toView(value: string | number | BigNumber): string {

    if ((value === null) || (value === undefined)) {
      return value as any;
    }

    if (typeof value === "string"){
      value = Utils.replaceAll(value, ",", "");
    }

    const parts = value.toString().split(".");
    /**
     * convert to a number
     */
    value = this.numberService.fromString(parts[0]);
    const partWithCommas = this.numberService.toString(value, { thousandSeparated: true, mantissa: -1 });
    // console.log("part: ", (parts.length === 1) ? partWithCommas : `${partWithCommas}.${parts[1]}`);
    return (parts.length === 1) ? partWithCommas : `${partWithCommas}.${parts[1]}`;
  }
}
