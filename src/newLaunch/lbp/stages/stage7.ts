import { ILbpConfig } from "newLaunch/lbp/config";
import { EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { Router, RouteConfig, Redirect } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { NumberService } from "services/NumberService";
import { TokenService } from "services/TokenService";
import { LbpManagerService } from "services/LbpManagerService";
import { toBigNumberJs } from "services/BigNumberService";
import { BigNumber } from "ethers";

@autoinject
export class Stage7 extends BaseStage<ILbpConfig> {

  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private lbpManagerService: LbpManagerService,
    ethereumService: EthereumService,
    tokenService: TokenService,
    private numberService: NumberService) {
    super(router, ethereumService, eventAggregator, tokenService);
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
    this.wizardState.requiredProjectTokenDeposit = BigNumber.from(
      toBigNumberJs(this.launchConfig.launchDetails.amountProjectToken).plus(toBigNumberJs(this.launchConfig.launchDetails.amountProjectToken)
        .multipliedBy(LbpManagerService.lbpFee)).toString());
    this.wizardState.requiredFundingTokenDeposit = BigNumber.from(this.launchConfig.launchDetails.amountFundingToken);
  }

  async submit(): Promise<void> {
    try {
      this.eventAggregator.publish("launch.creating", true);
      this.wizardState.launchHash = await this.lbpManagerService.deployLpbManager(this.launchConfig);
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
    } finally {
      this.eventAggregator.publish("launch.creating", false);
    }
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
