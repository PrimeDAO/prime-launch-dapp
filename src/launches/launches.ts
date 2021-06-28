import { SortOrder } from "./../services/SortService";
import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./launches.scss";
import { Seed } from "entities/Seed";
import { Utils } from "services/utils";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { SortService } from "services/SortService";

@singleton(false)
@autoinject
export class Launches {

  seeds: Array<Seed>;
  featuredSeeds: Array<Seed>;
  seeingMore: boolean;

  constructor(
    private router: Router,
    private eventAggregator: EventAggregator,
    private seedService: SeedService,
  ) {
  }

  async attached(): Promise<void> {
    if (!this.seeds?.length) {
      try {
        if (this.seedService.initializing) {
          await Utils.sleep(200);
          this.eventAggregator.publish("seeds.loading", true);
          await this.seedService.ensureInitialized();
        }
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        this.eventAggregator.publish("seeds.loading", false);
      }
    }

    this.seeds = this.seedService.seedsArray;
    this.featuredSeeds = await this.seedService.getFeaturedSeeds();
  }

  seeMore(yesNo: boolean): void {
    this.seeingMore = yesNo;
  }

  sortDirection = SortOrder.ASC;
  sortColumn: string;
  sortEvaluator: (a: any, b: any) => number;

  sort(columnName: string): void {

    if (this.sortColumn === columnName) {
      this.sortDirection = SortService.toggleSortOrder(this.sortDirection);
    } else {
      this.sortColumn = columnName;
    }

    switch (columnName) {
      case "seedToken":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateString(a.seedTokenInfo.symbol, b.seedTokenInfo.symbol, this.sortDirection);
        break;
      case "fundingToken":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateString(a.fundingTokenInfo.symbol, b.fundingTokenInfo.symbol, this.sortDirection);
        break;
      // case "type":
      //   this.sortEvaluator = (_a: Seed, _b: Seed) => 0;
      //   break;
      case "target":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateBigNumber(a.target, b.target, this.sortDirection);
        break;
      case "project":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateString(a.metadata?.general?.projectName, b.metadata?.general?.projectName, this.sortDirection);
        break;
      case "starts":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateDateTimeAsDate(a.startTime, b.startTime, this.sortDirection);
        break;
      case "cap":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateBigNumber(a.cap, b.cap, this.sortDirection);
        break;
      case "whitelist":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateBoolean(a.whitelisted, b.whitelisted, this.sortDirection);
        break;
    }
  }
}
