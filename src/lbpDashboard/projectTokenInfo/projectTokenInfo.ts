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

  @computedFrom("lbpMgr.fundingTokenInfo.priceChangePercentage_24h")
  get fundingTokenTrend(): number {
    if (this.lbpMgr?.fundingTokenInfo?.priceChangePercentage_24h > 0) {
      return 1;
    } else if (this.lbpMgr?.fundingTokenInfo?.priceChangePercentage_24h < 0) {
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

  @computedFrom("lbpMgr.fundingTokenInfo.priceChangePercentage_24h")
  get absolutePriceChange(): number {
    return Math.abs(this.lbpMgr?.fundingTokenInfo?.priceChangePercentage_24h);
  }
}
