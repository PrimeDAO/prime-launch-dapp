import { bindable, computedFrom, autoinject } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./projectTokenInfo.scss";

@autoinject
export class ProjectTokenInfo {
  @bindable lbpMgr: LbpManager;

  lbpMgrChanged(): void {
    if (!this.lbpMgr?.priceHistory) {
      this.lbpMgr.ensurePriceData();
    }
  }

  @computedFrom("lbpMgr.projectTokenInfo.price")
  get currentPrice(): number {
    return this.lbpMgr?.projectTokenInfo?.price;
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

  @computedFrom("currentPrice", "lbpMgr.priceHistory")
  get currentPriceChange(): number {
    const len = this.lbpMgr?.priceHistory?.length;
    if ((len > 1) && this.currentPrice) {
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
