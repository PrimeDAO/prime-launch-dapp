import { DisposableCollection } from "./../../services/DisposableCollection";
import { EventAggregator } from "aurelia-event-aggregator";
import { bindable, computedFrom, autoinject } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import { fromWei } from "services/EthereumService";
import { LbpProjectTokenPriceService } from "services/LbpProjectTokenPriceService";
import { NumberService } from "services/NumberService";
import "./projectTokenInfo.scss";

@autoinject
export class ProjectTokenInfo {
  @bindable lbpMgr: LbpManager;

  private subscriptions = new DisposableCollection();
  private currentPrice: number;

  constructor(
    private lbpProjectTokenPriceService: LbpProjectTokenPriceService,
    private numberService: NumberService,
    private eventAggregator: EventAggregator,
  ) {}

  attached(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("minutePassed", async () => {
      this.hydrateCurrentPrice(true);
    }));
  }

  detached(): void {
    this.subscriptions.dispose();
  }

  lbpMgrChanged(): void {
    if (!this.lbpMgr?.priceHistory) {
      this.hydrateCurrentPrice();
      this.lbpMgr.ensurePriceData();
    }
  }

  @computedFrom("currentPriceChange")
  get fundingTokenTrend(): number {
    if (this.currentPriceChange > 0) {
      return 1;
    } else if (this.currentPriceChange < 0) {
      return -1;
    }
    else {
      return 0;
    }
  }

  // can't find a way to do this in a expression in the HTML that doesn't break the compiler
  @computedFrom("fundingTokenTrend")
  get fundingTokenTrendSign(): string {
    return ((this.fundingTokenTrend > 0) ? "+" : (this.fundingTokenTrend < 0) ? "-" : "" );
  }

  async hydrateCurrentPrice(reset = false): Promise<void> {

    if (this.lbpMgr) {
      const vault = this.lbpMgr.lbp.vault;

      if (reset) {
        await this.lbpMgr.lbp.vault.hydrate();
      }

      const currentProjectTokenWeight = this.lbpProjectTokenPriceService.getProjectTokenWeightAtTime(
        new Date(),
        this.lbpMgr.startTime,
        this.lbpMgr.endTime,
        this.lbpMgr.projectTokenStartWeight,
        this.lbpMgr.projectTokenEndWeight,
      );

      this.currentPrice = this.lbpProjectTokenPriceService.getPriceAtWeight(
        this.numberService.fromString(fromWei(vault.projectTokenBalance, this.lbpMgr.projectTokenInfo.decimals)),
        this.numberService.fromString(fromWei(vault.fundingTokenBalance, this.lbpMgr.fundingTokenInfo.decimals)),
        currentProjectTokenWeight,
        1.0,
      );
    } else {
      this.currentPrice = 0.0;
    }
  }

  @computedFrom("currentPrice", "lbpMgr.priceHistory")
  get currentPriceChange(): number {
    const len = this.lbpMgr?.priceHistory?.length;
    if (len > 1) {
      const prevPrice = this.lbpMgr.priceHistory[len-2].price;
      return this.currentPrice - prevPrice;
    } else {
      return 0;
    }
  }

  @computedFrom("currentPriceChange")
  get absolutePriceChange(): number {
    return Math.abs(this.currentPriceChange);
  }

  @computedFrom("currentPriceChange", "currentPrice")
  get percentPriceChange(): number {
    return this.currentPrice ? (this.currentPriceChange / (this.currentPrice - this.currentPriceChange)) * 100 : 0;
  }
}
