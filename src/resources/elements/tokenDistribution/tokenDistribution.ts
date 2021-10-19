import { ITokenDetails } from "../../../newLaunch/launchConfig";
import { bindable } from "aurelia-framework";
import "./tokenDistribution.scss";
import * as moment from "moment";

export class TokenDistribution {
  @bindable data: Omit<ITokenDetails, "projectTokenInfo"> = null;
  @bindable startDate: Date = null;

  private percentageHeld(total: string, part: string): number {
    return ((100 * Number(part)) / Number(total));
  }

  private displayLockingPeriod(startDate:Date, vestedDays:string, cliffDays:string):string {
    const vestedEndDate: moment.Moment = moment(startDate).add(vestedDays, "d");
    const isCliffFinished = moment().isAfter(vestedEndDate);
    if (cliffDays) {
      return `${moment.duration(cliffDays, "days").humanize()} locked`;
    }
    if (isCliffFinished || (!cliffDays && vestedDays)) {
      return `${moment.duration(vestedDays, "days").humanize()} vested`;
    }
    return `${moment.duration(vestedDays, "days").humanize()} vested`;
  }
}
