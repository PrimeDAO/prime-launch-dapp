import { ISeedConfig } from "newLaunch/seed/config";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { BaseStage } from "newLaunch/baseStage";
import { EventAggregator } from "aurelia-event-aggregator";
import { EthereumService } from "services/EthereumService";
import { SeedService } from "services/SeedService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage6 extends BaseStage<ISeedConfig> {
  protected launchConfig: ISeedConfig;
  test: string;

  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private seedService: SeedService,
    ethereumService: EthereumService,
    tokenService: TokenService,
  ) {
    super(router, ethereumService, eventAggregator, tokenService);
  }

}
