import { ITokenDetails } from "./../../../newLaunch/launchConfig";
import { bindable } from "aurelia-framework";
import "./ringChart.scss";

export class RingChart {
  @bindable data: ITokenDetails | { [key: string]: string } = {};
  // lbpManager.metadata.tokenDetails
  // safety check for when sum exceeds total?
  // handle when sum not equals total
  private percentageHeld(total: string, part: string): number {
    return ((100 * Number(part)) / Number(total));
  }

  private toTimeDuration(days:number):string {
    if (days && days < 365) {
      return `${Math.round(days)} days`;
    } else if (days > 365 && days < 730) {
      return "one year";
    } else if (days > 730) {
      const toYears = days / 365;
      return `${Math.round(toYears)} years`;
    }
    return isNaN(days) ? "Cant calculate duration" : `${days} days`;
  }
}
