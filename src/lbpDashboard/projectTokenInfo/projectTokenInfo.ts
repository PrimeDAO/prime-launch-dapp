import { bindable, computedFrom } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./projectTokenInfo.scss";

export class ProjectTokenInfo {
  @bindable lbpMgr: LbpManager;

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

  @computedFrom("lbpMgr.fundingTokenInfo.priceChangePercentage_24h")
  get absolutePriceChange(): number {
    return Math.abs(this.lbpMgr?.fundingTokenInfo?.priceChangePercentage_24h);
  }
}
