import { EthereumService, isCeloNetworkLike } from "./../../services/EthereumService";
import { ILaunchConfig } from "../launchConfig";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { SeedService } from "services/SeedService";
import { BaseStage } from "newLaunch/baseStage";
import { IpfsService } from "services/IpfsService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage8 extends BaseStage<ILaunchConfig> {
  private dataToken = "";
  private copyMessage = "Hash has been copied to the clipboard";
  constructor(
    router: Router,
    ethereumService: EthereumService,
    eventAggregator: EventAggregator,
    tokenService: TokenService,
    private seedService: SeedService,
    private ipfsService: IpfsService) {

    super(router, ethereumService, eventAggregator, tokenService);
  }

  @computedFrom("wizardState.launchHash")
  get ipfsURL(): string {
    return this.ipfsService.getIpfsUrl(this.wizardState.launchHash);
  }

  attached():void{
    if (isCeloNetworkLike()) {
      this.dataToken = this.seedService?.celoData;
    }
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
