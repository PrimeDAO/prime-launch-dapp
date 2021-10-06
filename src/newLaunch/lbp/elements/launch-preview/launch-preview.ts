import { autoinject } from "aurelia-framework";
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

  constructor() {
    this.launchPreviewConfig = {
      marketCap: {
        low: 250200000,
        high: 16500000,
      },
      priceRange: {
        low: 250200000,
        high: 16500000,
      },
      duration: -1,
      fee: Math.round(0.01 * 100),
    };
  }
}
