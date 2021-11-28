import { LbpProjectTokenPriceService } from "services/LbpProjectTokenPriceService";
import { fromWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";
import { DateService } from "services/DateService";
import { LbpManagerService } from "services/LbpManagerService";
import { autoinject, computedFrom } from "aurelia-framework";
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
  trajectoryForecast: Array<{price: number, time: number}>,
  fee?: number,
}

@autoinject
export class LaunchPreview {
  @bindable maxSupply: number;
  @bindable projectTokenAddress: string;
  @bindable projectTokenDecimals: string;
  @bindable projectTokenAmount: number;
  @bindable fundingTokenAddress: string;
  @bindable fundingTokenDecimals: string;
  @bindable fundingTokenAmount: number;
  @bindable startDate: Date;
  @bindable endDate: Date;
  @bindable startWeight: number;
  @bindable endWeight: number;
  @bindable fundingTokenPrice: number;
  @bindable launchDuration: number;

  config: ILaunchPreviewConfig;
  fee: number;

  constructor(
    private numberService: NumberService,
    private lbpProjectTokenPriceService: LbpProjectTokenPriceService,
    private lbpManagerService: LbpManagerService,
    private dateService: DateService,
  ) {
  }

  @computedFrom("config")
  private get graphData(): Array<any> {
    return [
      {
        name: "",
        color: "#FF497A",
        data: this.config?.trajectoryForecast || [],
      },
    ];
  }

  attached(): void {
    if (this.config) {
      this.updateValues();
    }

    this.fee = LbpManagerService.lbpSwapFee;
  }

  maxSupplyChanged(): void { this.updateValues(); }
  projectTokenAddressChanged(): void { this.updateValues(); }
  projectTokenDecimalsChanged(): void { this.updateValues(); }
  projectTokenAmountChanged(): void { this.updateValues(); }
  fundingTokenAddressChanged(): void { this.updateValues(); }
  fundingTokenDecimalsChanged(): void { this.updateValues(); }
  fundingTokenAmountChanged(): void { this.updateValues(); }
  startDateChanged(): void { this.updateValues(); }
  endDateChanged(): void { this.updateValues(); }
  startWeightChanged(): void { this.updateValues(); }
  endWeightChanged(): void { this.updateValues(); }
  fundingTokenPriceChanged(): void { this.updateValues(); }
  launchDurationChanged(): void { this.updateValues(); }

  async updateValues(): Promise<void> {
    if (
      !this.fundingTokenAddress ||
      !this.projectTokenAddress
    ) return;

    const maxSupplyInEth = this.numberService.fromString(fromWei(
      this.maxSupply || "-1",
      this.projectTokenDecimals,
    ));

    const amountProjectTokenInEth = this.numberService.fromString(fromWei(
      this.projectTokenAmount || "-1",
      this.projectTokenDecimals,
    ));

    const amountFundingTokenInEth = this.numberService.fromString(fromWei(
      this.fundingTokenAmount || "-1",
      this.fundingTokenDecimals,
    ));

    const marketCapLow = this.lbpProjectTokenPriceService.getMarketCap(
      maxSupplyInEth,
      amountProjectTokenInEth,
      amountFundingTokenInEth,
      this.startWeight / 100,
      this.fundingTokenPrice,
    );

    const marketCapHigh = this.lbpProjectTokenPriceService.getMarketCap(
      maxSupplyInEth,
      amountProjectTokenInEth,
      amountFundingTokenInEth,
      this.endWeight / 100,
      this.fundingTokenPrice,
    );

    const priceRangeLow = this.lbpProjectTokenPriceService.getPriceAtWeight(
      amountProjectTokenInEth,
      amountFundingTokenInEth,
      this.startWeight / 100,
      this.fundingTokenPrice,
    );

    const priceRangeHigh = this.lbpProjectTokenPriceService.getPriceAtWeight(
      amountProjectTokenInEth,
      amountFundingTokenInEth,
      this.endWeight / 100,
      this.fundingTokenPrice,
    );

    const trajectoryForecast = await this.lbpProjectTokenPriceService.getInterpolatedPriceDataPoints(
      amountProjectTokenInEth,
      amountFundingTokenInEth,
      {
        start: this.dateService.translateLocalToUtc(this.startDate),
        end: this.dateService.translateLocalToUtc(this.endDate),
      },
      {
        start: this.startWeight / 100,
        end: this.endWeight / 100,
      },
      this.fundingTokenPrice,
    );

    this.config = {
      marketCap: {
        low: marketCapLow? marketCapLow.toString() : "-1",
        high: marketCapHigh? marketCapHigh.toString(): "-1",
      },
      priceRange: {
        low: priceRangeLow? priceRangeLow.toFixed(2): "-1",
        high: priceRangeHigh? priceRangeHigh.toFixed(2): "-1",
      },
      duration: this.launchDuration,
      trajectoryForecast,
    };
  }
}
