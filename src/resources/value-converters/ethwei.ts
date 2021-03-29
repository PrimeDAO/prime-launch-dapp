import { autoinject } from "aurelia-framework";
import { formatEther, parseEther } from "ethers/lib/utils";
import { BigNumber } from "ethers";
/**
 * Convert between Wei (as BigNumber) in viewmodel and eth (as string) in view.
 * Note that even if the viewmodel supplies a number, modified values are saved back
 * to the viewmodel as BigNumber.
 */
@autoinject
export class EthweiValueConverter {

  /**
   * ETH string from HTML input ==> BigNumber for the model
   *
   * When the string cannot be converted to a number, this will return the original string.
   * This helps the user see the original mistake.  Validation will need to make sure that the
   * incorrect value is not persisted.
   * @param ethValue
   */
  public fromView(ethValue: string | number): BigNumber {
    if ((ethValue === undefined) || (ethValue === null)) {
      return null;
    }

    return parseEther(ethValue.toString());
  }

  /**
   *  Wei BigNumber|string from model ==> ETH string in HTML input
   * @param weiValue
   */
  public toView(weiValue: BigNumber|string): string {
    try {
      if ((weiValue === undefined) || (weiValue === null)) {
        return "";
      }

      return formatEther(weiValue);
    } catch (ex) {
      return weiValue.toString();
    }
  }
}
