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

    if ((value === null) || (value === undefined)) {
      return value as any;
    }

    if (typeof value === "string"){
      value = value?.replace(",", ""); // cause it happens for some reason and the commas can be wrongly placed
    }
    /**
     * convert to a number
     */
    value = this.numberService.fromString(value);

    return this.numberService.toString(value, { thousandSeparated: true, mantissa: -1 });
  }
}
