import { IDisposable } from "services/IDisposable";
import { AureliaHelperService } from "services/AureliaHelperService";
import { ProjectTokenHistoricalPriceService } from "services/ProjectTokenHistoricalPriceService";
import { DateService } from "services/DateService";
import { bindable, autoinject } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import { LbpProjectTokenPriceService } from "services/LbpProjectTokenPriceService";
import { NumberService } from "services/NumberService";
import { fromWei } from "services/EthereumService";
import "./lbpPriceChart.scss";

@autoinject
export class LbpPriceChart {
  priceFetchIntervalId: any;
  dataPropertyWatcher: IDisposable;

  @bindable lbpMgr: LbpManager;

  constructor(
    private dateService: DateService,
    private projectTokenHistoricalPriceService: ProjectTokenHistoricalPriceService,
    private numberService: NumberService,
    private lbpProjectTokenPriceService: LbpProjectTokenPriceService,
    private aureliaHelperService: AureliaHelperService,
  ){
  }

  attached(): void {
    this.priceFetchIntervalId = setInterval(() => {
      this.hydrateChart(true);
    }, 60000);
  }

  detached(): void {
    if (this.priceFetchIntervalId) {
      clearInterval(this.priceFetchIntervalId);
      this.priceFetchIntervalId = null;
    }
  }

  lbpMgrChanged(): void {
    this.hydrateChart();
    if (this.dataPropertyWatcher){
      this.dataPropertyWatcher.dispose();
      this.dataPropertyWatcher = null;
    }

    if ( this.lbpMgr ) {
      this.dataPropertyWatcher = this.aureliaHelperService.createPropertyWatch(this.lbpMgr, "priceHistory", () => this.hydrateChart);
    }
  }

  private graphConfig: Array<any>;

  private async hydrateChart(reset = false): Promise<void> {
    if (this.lbpMgr) {

      if (reset || !this.lbpMgr.priceHistory) {
        await this.lbpMgr.ensurePriceData(reset);
      }

      const priceHistoryLength = this.lbpMgr.priceHistory?.length;
      const trajectoryForecastData = await this.projectTokenHistoricalPriceService.getTrajectoryForecastData(this.lbpMgr);

      const trajectoryForecastLength = trajectoryForecastData?.length;

      const lbpAveragePrice = this.lbpMgr.averagePrice;
      const averagePriceData = (lbpAveragePrice > 0 && priceHistoryLength > 1)? [
        {
          time: this.lbpMgr.priceHistory[0]?.time,
          price: lbpAveragePrice,
        },
        {
          time: trajectoryForecastLength > 0
            ? trajectoryForecastData[trajectoryForecastLength - 1]?.time
            : this.lbpMgr.priceHistory[priceHistoryLength - 1]?.time,
          price: lbpAveragePrice,
        },
      ] : [];

      const forecast = trajectoryForecastData?.map(i => {
        return {
          price: Math.floor(i.price * 100) / 100,
          time: this.dateService.translateLocalTimestampToUtc(i.time * 1000) / 1000,
        };
      });

      const history = this.lbpMgr.priceHistory?.map(i => {
        return {
          price: Math.floor(i.price * 100) / 100,
          time: this.dateService.translateLocalTimestampToUtc(i.time * 1000) / 1000,
        };
      });

      const vault = this.lbpMgr.lbp.vault;
      const currentPrice = Math.floor(this.lbpProjectTokenPriceService.getPriceAtWeight(
        this.numberService.fromString(fromWei(vault.projectTokenBalance, this.lbpMgr.projectTokenInfo.decimals)),
        this.numberService.fromString(fromWei(vault.fundingTokenBalance, this.lbpMgr.fundingTokenInfo.decimals)),
        this.lbpMgr.currentProjectTokenWeight,
        this.lbpMgr.fundingTokenInfo.price,
      ) * 100 ) / 100;

      const forecastStartTime = history[history.length - 1]?.time || 0;
      const futureForecast = forecast?.filter((item) => item.time >= forecastStartTime);

      history[history.length - 1].price = currentPrice;
      futureForecast[0].price = currentPrice;

      this.graphConfig = [
        {
          data: history,
          color: "#FF497A",
        },
        {
          data: futureForecast,
          color: "#403453",
          lineStyle: 2,
        },
        {
          name: "Average Price",
          data: averagePriceData?.map(i => {
            return {
              price: i.price,
              time: this.dateService.translateLocalTimestampToUtc(i.time * 1000) / 1000,
            };
          }),
          color: "#A258A7",
          lineWidth: 1,
        },
      ];
    }
  }
}
