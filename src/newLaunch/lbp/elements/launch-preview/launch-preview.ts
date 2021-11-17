import { LbpManagerService } from "services/LbpManagerService";
import { autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { AureliaHelperService } from "services/AureliaHelperService";
import "./launch-preview.scss";

interface IHighLow {
  high: string;
  low: string;
}

export interface ILaunchPreviewConfig {
  marketCap: IHighLow,
  priceRange: IHighLow,
  duration: number,
  trajectoryForecast: Array<{price: number, time: number}>,
  fee?: number,
}

@autoinject
export class LaunchPreview {
  private fee: number;
  @bindable config: ILaunchPreviewConfig;

  constructor(
    private aureliaHelperService: AureliaHelperService,
  ) {
    this.fee = LbpManagerService.lbpSwapFee;
  }

  // attached() {
  //   this.config.trajectoryForecast = [];
  // }
}
