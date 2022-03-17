import { BigNumber } from "ethers";
import { fromWei, toWei } from "services/EthereumService";
/**
 * Convert between Wei (as BigNumber) in viewmodel and eth (as string) in view.
 * Note that even if the viewmodel supplies a number, modified values are saved back
 * to the viewmodel as BigNumber.
 */
export class EthweiValueConverter {

  /**
   * ETH string from HTML input ==> BigNumber for the model
   *
   * When the string cannot be converted to a number, this will return the original string.
   * This helps the user see the original mistake.  Validation will need to make sure that the
   * incorrect value is not persisted.
   *
   * @param ethValue
   * @param decimals Default is 18.
   */
  public fromView(ethValue: string | number, decimals: string | number = 18): BigNumber {
    if ((ethValue === undefined) || (ethValue === null) || ((typeof ethValue === "string") && ((ethValue as string)?.trim() === ""))) {
      return null;
    }

    return toWei(ethValue.toString(), decimals);
  }

  /**
   *  Wei BigNumber|string from model ==> ETH string in HTML input
   * @param weiValue
   * @param decimals Default is 18.
   */
  public toView(weiValue: BigNumber | string, decimals: string | number = 18): string {
    try {
      if ((weiValue === undefined) || (weiValue === null)) {
        return "";
      }

      return fromWei(weiValue, decimals);
    } catch (ex) {
      return weiValue.toString();
    }
  }
}
