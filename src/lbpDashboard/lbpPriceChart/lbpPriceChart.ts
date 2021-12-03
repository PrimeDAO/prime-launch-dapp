import { IDisposable } from "services/IDisposable";
// import { AureliaHelperService } from "services/AureliaHelperService";
import { ProjectTokenHistoricalPriceService } from "services/ProjectTokenHistoricalPriceService";
import { DateService } from "services/DateService";
import { bindable, autoinject } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./lbpPriceChart.scss";

@autoinject
export class LbpPriceChart {
  priceFetchIntervalId: any;
  dataPropertyWatcher: IDisposable;

  @bindable lbpMgr: LbpManager;

  constructor(
    private dateService: DateService,
    private projectTokenHistoricalPriceService: ProjectTokenHistoricalPriceService,
    // private aureliaHelperService: AureliaHelperService,
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
    // if (this.dataPropertyWatcher){
    //   this.dataPropertyWatcher.dispose();
    //   this.dataPropertyWatcher = null;
    // }

    // if ( this.lbpMgr ) {
    //   this.dataPropertyWatcher = this.aureliaHelperService.createPropertyWatch(this.lbpMgr, "priceHistory", this.hydrateChart);
    // }
  }

  private graphConfig: Array<any>;

  private async hydrateChart(reset = false): Promise<void> {
    if (this.lbpMgr) {

      if (!this.lbpMgr.priceHistory) {
        await this.lbpMgr.ensurePriceData(reset);
      }

      const priceHistoryLength = this.lbpMgr.priceHistory?.length;
      const trajectoryForecastData = await this.projectTokenHistoricalPriceService.getTrajectoryForecastData(this.lbpMgr);

      const trajectoryForecastLength = trajectoryForecastData?.length;

      const lbpAveragePrice = priceHistoryLength
        ? (this.lbpMgr.priceHistory.reduce((a, b) => a + b.price, 0) / priceHistoryLength)
        : 0;
      const averagePriceData = (lbpAveragePrice > 0 && priceHistoryLength)? [
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

      this.graphConfig = [
        {
          data: this.lbpMgr.priceHistory?.map(i => {
            return {
              price: i.price,
              time: this.dateService.translateLocalTimestampToUtc(i.time),
            };
          }),
          color: "#FF497A",
        },
        {
          data: trajectoryForecastData?.map(i => {
            return {
              price: i.price,
              time: this.dateService.translateLocalTimestampToUtc(i.time),
            };
          }),
          color: "#403453",
          lineStyle: 2,
        },
        {
          name: "Average Price",
          data: averagePriceData?.map(i => {
            return {
              price: i.price,
              time: this.dateService.translateLocalTimestampToUtc(i.time),
            };
          }),
          color: "#A258A7",
          lineWidth: 1,
        },
      ];

    }
  }
}
