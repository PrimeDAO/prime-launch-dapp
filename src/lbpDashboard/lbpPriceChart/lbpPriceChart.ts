import { IHistoricalPriceRecord, ProjectTokenHistoricalPriceService } from "services/ProjectTokenHistoricalPriceService";
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

        const history = this.lbpMgr.priceHistory?.map(i => {
          return {
            price: i.price,
            time: i.time + 3600,
          };
        }) || [];

        const futureForecast = [];
        await this.projectTokenHistoricalPriceService.getTrajectoryForecastData(this.lbpMgr).then(data => {
          if (data?.length) {
            data.reduce((_: any, option: IHistoricalPriceRecord):IHistoricalPriceRecord => {
              if (option.time > (history[history.length - 1]?.time || this.dateService.dateToTicks(this.lbpMgr.startTime) / 1000)
               && option.time <= (this.dateService.dateToTicks(this.lbpMgr.endTime) / 1000)) {
                futureForecast.push({
                  price: option.price,
                  time: option.time,
                });
                return;
              }
            });
          }});

        if (!history.length) {
          history.push({
            time: this.dateService.dateToTicks(this.lbpMgr.startTime) / 1000,
            price: futureForecast[0].price,
          });
          history.push({
            time: this.dateService.dateToTicks(this.lbpMgr.startTime) / 1000 + 3600,
            price: futureForecast[0].price,
          });
        } else {
          history[history.length - 1].price = this.lbpMgr.projectTokenInfo.price;
        }

        const lbpAveragePrice = this.lbpMgr.averagePrice;
        const averagePriceData = (lbpAveragePrice > 0)? [
          {
            time: history[0]?.time,
            price: lbpAveragePrice,
          },
          {
            time: (futureForecast[futureForecast.length - 1]?.time || history[history.length - 1]?.time),
            price: lbpAveragePrice,
          },
        ] : [];

        this.graphConfig = [
          {
            name: "Average Price",
            data: averagePriceData,
            color: "#A258A7",
            lineWidth: 1,
          },
          {
            data: futureForecast,
            color: "#403453",
            lineStyle: 2,
          },
          {
            data: history,
            color: "#FF497A",
          },
        ];
      } finally {
        this.isHydrating = false;
      }
    }
  }
}
