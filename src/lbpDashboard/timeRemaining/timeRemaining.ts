import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import { IHistoricalPriceRecord } from "services/ProjectTokenHistoricalPriceService";
import "./timeRemaining.scss";

export class TimeRemaining {
  @bindable lbpMgr: LbpManager;
  @bindable priceHistory: Array<IHistoricalPriceRecord>;

  lbpMgrChanged(): void {
    if (!this.lbpMgr?.priceHistory) {
      this.lbpMgr.ensurePriceHistory();
    }
  }
}
