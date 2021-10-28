import { autoinject, bindingMode, customElement } from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";
import { LbpManager } from "entities/LbpManager";
import { Seed } from "entities/Seed";
import { ILaunch } from "services/launchTypes";
import { LbpManagerService } from "services/LbpManagerService";
import { SeedService } from "services/SeedService";
import { SortService } from "services/SortService";
import { bindable } from "aurelia-typed-observable-plugin";

// for webpack
PLATFORM.moduleName("../launchCards/seedCard.html");
PLATFORM.moduleName("../launchCards/lbpCard.html");

@customElement("featuredlaunches")
@autoinject
export class FeaturedLaunches {

  launches: Array<ILaunch>;

  @bindable.booleanAttr({ defaultBindingMode: bindingMode.fromView })
  loading = true;

  constructor(
    private seedService: SeedService,
    private lbpManagerService: LbpManagerService,
  ) {}

  async attached(): Promise<void> {
    this.loading = true;

    await this.seedService.ensureAllSeedsInitialized();
    await this.lbpManagerService.ensureAllLbpsInitialized();

    this.launches = (this.seedService.seedsArray as Array<ILaunch>)
      .filter((seed: Seed) => { return !seed.uninitialized && !seed.corrupt && (seed.hasNotStarted || seed.contributingIsOpen); })
      .concat((this.lbpManagerService.lbpManagersArray as Array<ILaunch>)
        .filter((lbpMgr: LbpManager) => { return !lbpMgr.uninitialized && !lbpMgr.corrupt && !lbpMgr.isDead; }))
      .sort((a: ILaunch, b: ILaunch) => SortService.evaluateDateTimeAsDate(a.startTime, b.startTime))
      .slice(0, 3)
    ;

    this.loading = false;
  }
}
