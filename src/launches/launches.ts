import { EthereumService } from "services/EthereumService";
import { SortOrder } from "./../services/SortService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./launches.scss";
import { Seed } from "entities/Seed";
import { SortService } from "services/SortService";
import { Utils } from "services/utils";
import { SeedService } from "services/SeedService";
import { ILaunch } from "services/launchTypes";
import { LbpManagerService } from "services/LbpManagerService";

@singleton(false)
@autoinject
export class Launches {

  launches: Array<ILaunch>;
  seeingMore = false;
  loading: boolean;

  constructor(
    private router: Router,
    private ethereumService: EthereumService,
    private seedService: SeedService,
    private lbpManagerService: LbpManagerService,
  ) {
    this.sort("starts"); // sort order will be ASC
  }

  isAdmin(launch: ILaunch): boolean {
    return launch.admin === this.ethereumService.defaultAccountAddress;
  }

  async attached(): Promise<void> {
    this.loading = true;

    await this.seedService.ensureAllSeedsInitialized();
    await this.lbpManagerService.ensureAllLbpsInitialized();

    this.launches = (this.seedService.seedsArray as Array<ILaunch>)
      .concat(this.lbpManagerService.lbpManagersArray as Array<ILaunch>);

    this.loading = false;
  }

  seeMore(yesNo: boolean): void {
    this.seeingMore = yesNo;
  }

  sortDirection = SortOrder.DESC;
  sortColumn: string;
  sortEvaluator: (a: any, b: any) => number;

  sort(columnName: string): void {

    if (this.sortColumn === columnName) {
      this.sortDirection = SortService.toggleSortOrder(this.sortDirection);
    } else {
      this.sortColumn = columnName;
    }

    switch (columnName) {
      case "projectToken":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateString(a.projectTokenInfo.symbol, b.projectTokenInfo.symbol, this.sortDirection);
        break;
      case "fundingToken":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateString(a.fundingTokenInfo.symbol, b.fundingTokenInfo.symbol, this.sortDirection);
        break;
      case "type":
        this.sortEvaluator = (_a: Seed, _b: Seed) => 0;
        break;
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

  gotoEtherscan(seed: Seed, event: Event): boolean {
    Utils.goto(this.ethereumService.getEtherscanLink(seed.address));
    event.stopPropagation();
    return false;
  }

  onSeedClick(launch: ILaunch): void {
    this.router.navigate(launch.canGoToDashboard ? `${launch.launchType}/${launch.address}` :
      `/admin/${launch.launchType}s/dashboard/${launch.address}`);
  }
}
