import { ISeedConfig } from "newLaunch/seed/config";
import { EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { Router, RouteConfig, Redirect } from "aurelia-router";
import { SeedService } from "services/SeedService";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { fromWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage7 extends BaseStage<ISeedConfig> {

  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private seedService: SeedService,
    private ethereumService: EthereumService,
    tokenService: TokenService,
    private numberService: NumberService) {
    super(router, eventAggregator, tokenService);
  }

  public async canActivate(_params: unknown, routeConfig: RouteConfig): Promise<boolean | Redirect> {
    /**
     * heuristic for whether we have data.  Possibility is that the user
     * has used the 'back' button or otherwize figured out how to return
     * to this page, for example, just after having submitting a Seed,
     * where the launchConfig will have been deleted.
     */
    if (!routeConfig.settings.launchConfig.general.projectName?.length) {
      return new Redirect("");
    } else {
      return true;
    }
  }

  attached(): void {
    // this.launchConfig.launchDetails.fundingMax = toWei("100").toString();
    // this.launchConfig.launchDetails.pricePerToken = toWei(".5").toString();
    // this.launchConfig.tokenDetails.projectTokenInfo.symbol = "PRIME";
    const distributableSeeds = this.numberService.fromString(fromWei(this.launchConfig.launchDetails.fundingMax, this.launchConfig.launchDetails.fundingTokenInfo.decimals))
      / this.numberService.fromString(fromWei(this.launchConfig.launchDetails.pricePerToken, this.launchConfig.launchDetails.fundingTokenInfo.decimals));
    this.wizardState.requiredLaunchFee = distributableSeeds * SeedService.seedFee;
    this.wizardState.requiredSeedDeposit = distributableSeeds + this.wizardState.requiredLaunchFee;
  }

  async submit(): Promise<void> {
    try {
      this.eventAggregator.publish("launch.creating", true);
      this.wizardState.launchHash = await this.seedService.deploySeed(this.launchConfig);
      if (this.wizardState.launchHash) {
      // this.eventAggregator.publish("handleInfo", `Successfully pinned seed registration hash at: this.ipfsService.getIpfsUrl(this.launchHash)`);
        this.launchConfig.clearState();
        for (let i = 1; i <= this.maxStage; ++i) {
          this.stageStates[i].verified = false;
        }
        this.eventAggregator.publish("launch.clearState", true);
        this.next();
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("launch.creating", false);
    }
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean { return !!this.ethereumService.defaultAccountAddress;}

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
