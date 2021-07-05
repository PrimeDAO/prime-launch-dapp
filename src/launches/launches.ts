import { SortOrder } from "./../services/SortService";
import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./launches.scss";
import { Seed } from "entities/Seed";
import { SortService } from "services/SortService";

@singleton(false)
@autoinject
export class Launches {

  seeds: Array<Seed>;
  featuredSeeds: Array<Seed> = [];
  seeingMore: boolean;

  constructor(
    private router: Router,
    private seedService: SeedService,
  ) {
  }

  attached(): void {
    this.seedService.getFeaturedSeeds().then((seeds) => {
      this.featuredSeeds = seeds;
    });

    this.seedService.ensureInitialized().then(() => {
      this.seeds = this.seedService.seedsArray;
    });
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
