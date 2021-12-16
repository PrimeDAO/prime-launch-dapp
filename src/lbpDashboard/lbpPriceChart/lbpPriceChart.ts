import { ProjectTokenHistoricalPriceService } from "services/ProjectTokenHistoricalPriceService";
import { DateService } from "services/DateService";
import { bindable, autoinject } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./lbpPriceChart.scss";

@autoinject
export class LbpPriceChart {
  @bindable lbpMgr: LbpManager;
  @bindable refresh: boolean; // value is irrelevent.  only used to trigger a refresh
  private isHydrating = false;

  constructor(
    private dateService: DateService,
    private projectTokenHistoricalPriceService: ProjectTokenHistoricalPriceService,
  ){
  }

  refreshChanged(): void {
    this.hydrateChart();
  }

  private graphConfig: Array<any>;

  private async hydrateChart(): Promise<void> {
    if (this.lbpMgr && !this.isHydrating) {
      try {
        this.isHydrating = true;

        if (!this.lbpMgr.priceHistory) {
          await this.lbpMgr.ensurePriceData();
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
            price: i.price,
            time: this.dateService.translateLocalTimestampToUtc(i.time * 1000) / 1000,
          };
        });

        const history = this.lbpMgr.priceHistory?.map(i => {
          return {
            price: i.price,
            time: this.dateService.translateLocalTimestampToUtc(i.time * 1000) / 1000,
          };
        });

        const currentPrice = this.lbpMgr.projectTokenInfo.price;

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
      } finally {
        this.isHydrating = false;
      }
    }
  }
}
