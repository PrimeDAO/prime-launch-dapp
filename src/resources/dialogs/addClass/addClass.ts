import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { Router } from "aurelia-router";
import { ISeedConfig } from "newLaunch/seed/config";
import { EthereumService } from "services/EthereumService";
import { ITokenInfo, TokenService } from "services/TokenService";
import "./addClass.scss";
import { LaunchService } from "services/LaunchService";
// import "@stackoverflow/stacks/dist/css/stacks.min.css";

@autoinject
export class AddClassModal extends BaseStage<ISeedConfig> {

  private model: IAddClassModal;
  private okButton: HTMLElement;
  launchConfig: ISeedConfig;
  tokenList: Array<ITokenInfo>;


  className: string;
  projectTokenPurchaseLimit: number;
  allowList: string;
  token: ITokenInfo;
  tokenExchangeRatio: number;
  fundingTokensTarget: number;
  fundingTokenMaximum: number;


  constructor(
    private controller: DialogController,
    eventAggregator: EventAggregator,
    ethereumService: EthereumService,
    router: Router,
    tokenService: TokenService,
    private launchService: LaunchService,
  ) {
    super(router, ethereumService, eventAggregator, tokenService);
  }

  public async activate(model: IAddClassModal): Promise<void> {
    this.model = model;
    if (!this.tokenList) {
      this.tokenList = await this.launchService.fetchFundingTokenInfos();
    }
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }

  tokenChanged(): void {
    console.log();
  }
}

interface IAddClassModal {
  parameter: string;
}
