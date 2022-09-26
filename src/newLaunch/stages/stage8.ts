import { EthereumService } from "./../../services/EthereumService";
import { ILaunchConfig } from "../launchConfig";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { IpfsService } from "services/IpfsService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage8 extends BaseStage<ILaunchConfig> {
  constructor(
    router: Router,
    ethereumService: EthereumService,
    eventAggregator: EventAggregator,
    tokenService: TokenService,
    private ipfsService: IpfsService) {

    super(router, ethereumService, eventAggregator, tokenService);
  }

  @computedFrom("wizardState.launchHash")
  get ipfsURL(): string {
    return this.ipfsService.getIpfsUrl(this.wizardState.launchHash);
  }

  async detached():Promise<void>{
    if (this.wizardState.launchHash){
      this.launchConfig.clearState();
      for (let i = 1; i <= this.maxStage; ++i) {
        this.stageStates[i].verified = false;
      }
      this.eventAggregator.publish("launch.clearState", true);
    }
  }
}
