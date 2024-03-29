import { EventAggregator } from "aurelia-event-aggregator";
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
import { LaunchType } from "services/launchTypes";
import { LbpManager } from "entities/LbpManager";
import { TokenService } from "services/TokenService";

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
    private eventAggregator: EventAggregator,
    private tokenService: TokenService,
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

    const seeds = this.seedService.seedsArray as Array<ILaunch>;
    const lbps = this.lbpManagerService.lbpManagersArray as Array<ILaunch>;

    this.launches = (seeds).concat(lbps);
    this.launches = filterOutTestLaunches(this.launches);

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
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateString(a.launchType, b.launchType, this.sortDirection);
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
      case "allowlist":
        this.sortEvaluator = (a: Seed, b: Seed) => SortService.evaluateBoolean(a.whitelisted, b.whitelisted, this.sortDirection);
        break;
    }
  }

  gotoEtherscan(launch: ILaunch, event: Event): boolean {
    if (launch.launchType === LaunchType.LBP ){
      Utils.goto(this.ethereumService.getEtherscanLink((launch as LbpManager).lbp.address));
    } else {
      Utils.goto(this.ethereumService.getEtherscanLink(launch.address));
    }
    event.stopPropagation();
    return false;
  }

  onLaunchClick(launch: ILaunch): void {
    if (launch.launchType === "seed") {
      this.router.navigate(`seed/${launch.address}`);
    } else {
      this.router.navigate(`/admin/${launch.launchType}s/dashboard/${launch.address}`);
    }
  }
}


/**
   * On Production, we don't want to show "Test" launches.
   * We have the case of test launches in production due to:
   *   1. Actually want to perform real tests on production env
   *   2. Certain networks only have Gnosis Safe on production (ie. Celo)
   */
export function filterOutTestLaunches(launches: ILaunch[]): ILaunch[] {
  const productionUrl = "launch.prime.xyz";
  const isProductionUrl = window.location.host === productionUrl;
  if (!isProductionUrl) return launches;

  const filteredLaunches = launches.filter((launch) => {
    const testIdentifier = "Test";
    const isTest = launch.metadata.general.projectName.includes(testIdentifier);
    const isAccepted = !isTest;
    return isAccepted;
  });

  return filteredLaunches;
}
