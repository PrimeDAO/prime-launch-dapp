import { DateService, TimespanResolution } from "./../../services/DateService";
import { autoinject, bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./timeRemaining.scss";
import tippy from "tippy.js";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";

@autoinject
export class TimeRemaining {
  @bindable lbpMgr: LbpManager;
  timeRemaining: HTMLElement;
  tippyInstance: any;
  subscriptions = new DisposableCollection();

  constructor(
    private dateService: DateService,
    private eventAggregator: EventAggregator,
  ) {
  }

  attached(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", (_state: { now: Date }) => {
      this.setTooltip();
    }));
  }

  detached(): void {
    this.subscriptions.dispose();
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
