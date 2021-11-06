import { DateService, TimespanResolution } from "./../../services/DateService";
import { autoinject, bindable, computedFrom } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import { IHistoricalPriceRecord } from "services/ProjectTokenHistoricalPriceService";
import "./timeRemaining.scss";
import tippy from "tippy.js";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";

@autoinject
export class TimeRemaining {
  @bindable lbpMgr: LbpManager;
  @bindable priceHistory: Array<IHistoricalPriceRecord>;
  timeRemaining: HTMLElement;
  tippyInstance: any;
  subscriptions = new DisposableCollection();

  constructor(
    private dateService: DateService,
    private eventAggregator: EventAggregator) {
  }

  attached(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", (_state: { now: Date }) => {
      this.setTooltip();
    }));
  }

  detached(): void {
    this.subscriptions.dispose();
  }

  lbpMgrChanged(): void {
    if (!this.lbpMgr?.priceHistory) {
      this.lbpMgr.ensurePriceHistory();
    }
  }

  @computedFrom("lbpMgr.priceHistory")
  get averagePrice(): number {
    return this.lbpMgr?.priceHistory?.length ?
      (this.lbpMgr.priceHistory.reduce((a, b) => a + b.price, 0) / this.lbpMgr.priceHistory.length) : 0;
  }

  private setTooltip() {
    if (this.timeRemaining && this.lbpMgr?.endsInMilliseconds) {
      if (!this.tippyInstance) {
        this.tippyInstance = tippy(this.timeRemaining);
      }
      // eslint-disable-next-line no-bitwise
      this.tippyInstance.setContent(this.dateService.ticksToTimeSpanString(this.lbpMgr.endsInMilliseconds, TimespanResolution.seconds));
    }
  }

}
