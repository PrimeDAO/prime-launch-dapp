import { autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./launch-preview.scss";

interface IHighLow {
  high: number;
  low: number;
}

interface ILaunchPreviewConfig {
  marketCap: IHighLow,
  priceRange: IHighLow,
  duration: number,
  fee: number,
}

@autoinject
export class LaunchPreview {

  private launchPreviewConfig: ILaunchPreviewConfig;
  private marketCapLow: number;
  private marketCapHigh: number;
  private priceRangeLow: number;
  private priceRangeHigh: number;

  @bindable duration: number;
  @bindable fee: number;
  @bindable startWeight: number;
  @bindable endWeight: number;

}
