import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject /* , computedFrom */ } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { TokenService } from "services/TokenService";
// import { IpfsService } from "services/IpfsService";

@autoinject
export class Stage8 extends BaseStage {
  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    tokenService: TokenService,
    // private ipfsService: IpfsService,
  ) {
    super(router, eventAggregator, tokenService);
  }

  // @computedFrom("wizardState.lbpHash")
  // get ipfsURL(): string {
  //   return this.ipfsService.getIpfsUrl(this.wizardState.lbpHash);
  // }
}
