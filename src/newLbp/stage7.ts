import { EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { Router, RouteConfig, Redirect } from "aurelia-router";
// import { LbpService } from "services/LbpService";
import { EventAggregator } from "aurelia-event-aggregator";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage7 extends BaseStage {

  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    // private lbpService: LbpService,
    private ethereumService: EthereumService,
    tokenService: TokenService,
  ) {
    super(router, eventAggregator, tokenService);
  }

  public async canActivate(_params: unknown, routeConfig: RouteConfig): Promise<boolean | Redirect> {
    /**
     * heuristic for whether we have data.  Possibility is that the user
     * has used the 'back' button or otherwize figured out how to return
     * to this page, for example, just after having submitting a Seed,
     * where the seedConfig will have been deleted.
     */
    if (!routeConfig.settings.lbpConfig.general.projectName?.length) {
      return new Redirect("");
    } else {
      return true;
    }
  }

  attached(): void {
    // ToDo
  }

  async submit(): Promise<void> {
    // ToDo
    this.next();
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean { return !!this.ethereumService.defaultAccountAddress;}

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
