import { NumberService } from "./../../services/NumberService";
import { DateService, TimespanResolution } from "./../../services/DateService";
import { autoinject, bindable, computedFrom } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import { IHistoricalPriceRecord } from "services/ProjectTokenHistoricalPriceService";
import "./timeRemaining.scss";
import tippy from "tippy.js";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { fromWei } from "services/EthereumService";

@autoinject
export class TimeRemaining {
  @bindable lbpMgr: LbpManager;
  @bindable priceHistory: Array<IHistoricalPriceRecord>;
  timeRemaining: HTMLElement;
  tippyInstance: any;
  subscriptions = new DisposableCollection();

  constructor(
    private dateService: DateService,
    private eventAggregator: EventAggregator,
    private numberService: NumberService,
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

  lbpMgrChanged(): void {
    if (!this.lbpMgr?.priceHistory) {
      this.lbpMgr.ensurePriceData();
    }
  }

  @computedFrom("lbpMgr.lbp.vault.tokenTotals", "lbpMgr.fundingTokenInfo.price")
  get averagePrice(): number {
    let result = 0;
    if (this.lbpMgr?.lbp?.vault?.tokenTotals.fundingRaised !== undefined) {
      const totals = this.lbpMgr.lbp.vault.tokenTotals;
      /**
       * fundingTokensSpentPerProjectToken = totalFundingTokensSpent/projectTokensPurchased
       * totals.fundingRaised includes fees
       */
      result =
          (this.numberService.fromString(fromWei(totals.fundingRaised, this.lbpMgr.fundingTokenInfo.decimals)) * this.lbpMgr.fundingTokenInfo.price) /
           this.numberService.fromString(fromWei(totals.projectSold, this.lbpMgr.projectTokenInfo.decimals));
    }
    return result;
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
