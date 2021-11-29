import {autoinject} from "aurelia-framework";
import { BigNumber } from "ethers";
import { NumberService } from "../../services/NumberService";

/**
 * when a number is retrieved from the element to which it is bound, convert it from a string to a number.
 */
@autoinject
export class WithCommasValueConverter {

  constructor(private numberService: NumberService) { }

  public fromView(value: string): string {
    return value?.replace(",", "");
  }

  public toView(value: string | number | BigNumber): string {

    if ((value === null) || (value === undefined)) { //  || (value === ".") || (Number(value) === 0)
      return value as any;
    }

    if (typeof value === "string"){
      value = value?.replace(",", ""); // cause it happens for some reason and the commas can be wrongly placed
    }

    const parts = value.toString().split(".");
    /**
     * convert to a number
     */
    value = this.numberService.fromString(parts[0]);
    const partWithCommas = this.numberService.toString(value, { thousandSeparated: true, mantissa: -1 });
    return (parts.length === 1) ? partWithCommas : `${partWithCommas}.${parts[1]}`;
  }
}
