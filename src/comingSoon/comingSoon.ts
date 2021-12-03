import { AppStartDate } from "app";
import { autoinject } from "aurelia-framework";
import { DateService } from "services/DateService";
import "./comingSoon.scss";

@autoinject
export class ComingSoon {


  constructor(
    private dateService: DateService,
  ) {
  }

  private get msUntilCanLockCountdown(): number {
    return Math.max(AppStartDate.getTime() - Date.now(), 0);
  }
}
