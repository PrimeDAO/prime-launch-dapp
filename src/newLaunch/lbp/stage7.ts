import { EthereumService } from "../../services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { Router, RouteConfig, Redirect } from "aurelia-router";
import { LbpService } from "services/LbpService";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
// import { fromWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";
import { TokenService } from "services/TokenService";

@autoinject
export class Stage7 extends BaseStage {

  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private lbpService: LbpService,
    private ethereumService: EthereumService,
    tokenService: TokenService,
    private numberService: NumberService) {
    super(router, eventAggregator, tokenService);
  }

  public async canActivate(_params: unknown, routeConfig: RouteConfig): Promise<boolean | Redirect> {
    /**
     * heuristic for whether we have data.  Possibility is that the user
     * has used the 'back' button or otherwize figured out how to return
     * to this page, for example, just after having submitting a Lbp,
     * where the lbpConfig will have been deleted.
     */
    if (!routeConfig.settings.lbpConfig.general.projectName?.length) {
      return new Redirect("");
    } else {
      return true;
    }
  }

  attached(): void {
    // this.lbpConfig.lbpDetails.fundingMax = toWei("100").toString();
    // this.lbpConfig.lbpDetails.pricePerToken = toWei(".5").toString();
    // this.wizardState.projectTokenSymbol = "PRIME";
    // const distributableLbps = this.numberService.fromString(fromWei(this.lbpConfig.lbpDetails.fundingMax))
    //   / this.numberService.fromString(fromWei(this.lbpConfig.lbpDetails.pricePerToken));
    // this.wizardState.requiredLbpFee = distributableLbps * this.lbpFee;
    // this.wizardState.requiredLbpDeposit = distributableLbps + this.wizardState.requiredLbpFee;
  }

  async submit(): Promise<void> {
    try {
      this.eventAggregator.publish("lbp.creating", true);
      this.wizardState.lbpHash = await this.lbpService.deployLbp(this.lbpConfig);
      if (this.wizardState.lbpHash) {
      // this.eventAggregator.publish("handleInfo", `Successfully pinned LBP registration hash at: this.ipfsService.getIpfsUrl(this.lbpHash)`);
        this.lbpConfig.clearState();
        for (let i = 1; i <= this.maxStage; ++i) {
          this.stageStates[i].verified = false;
        }
        this.eventAggregator.publish("lbp.clearState", true);
        this.next();
      }
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("lbp.creating", false);
    }
  }

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean { return !!this.ethereumService.defaultAccountAddress;}

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
