import { bindable, computedFrom } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./projectTokenInfo.scss";

export class ProjectTokenInfo {
  @bindable lbpMgr: LbpManager;

  lbpMgrChanged(): void {
    if (!this.lbpMgr?.priceHistory) {
      this.lbpMgr.ensurePriceHistory();
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

  @computedFrom("lbpMgr.priceHistory")
  get currentPrice(): number {
    const len = this.lbpMgr?.priceHistory?.length;
    return len ? this.lbpMgr.priceHistory[len-1].price : 0;
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
    return this.currentPrice ? this.currentPriceChange / this.currentPrice : 0;
  }
}
