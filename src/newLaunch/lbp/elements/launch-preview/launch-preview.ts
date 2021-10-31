import { LbpManagerService } from "services/LbpManagerService";
import { autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./launch-preview.scss";

interface IHighLow {
  high: string;
  low: string;
}

export interface ILaunchPreviewConfig {
  marketCap: IHighLow,
  priceRange: IHighLow,
  duration: number,
  fee?: number,
}

@autoinject
export class LaunchPreview {
  private fee: number;
  @bindable config: ILaunchPreviewConfig;

  constructor(
    config: ILaunchPreviewConfig,
  ) {
    this.config = config;
    this.fee = LbpManagerService.lbpSwapFee;
  }
}
