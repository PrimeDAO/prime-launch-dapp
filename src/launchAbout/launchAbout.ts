import { EthereumService } from "services/EthereumService";
import { containerless, computedFrom, autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { LaunchService } from "services/LaunchService";
import { ILaunch } from "services/launchTypes";
import "./launchAbout.scss";

type LayoutType = "oneColumn" | "twoColumn";
type LaunchType = "seed" | "lbp";

@containerless
@autoinject
export class LaunchAbout{

  @bindable launch: ILaunch;
  @bindable layoutType: LayoutType;
  @bindable launchType: LaunchType;

  constructor(
    private ethereumService: EthereumService,
    private launchService: LaunchService,
  ) {}

  @computedFrom("launch.userHydrated", "ethereumService.defaultAccountAddress")
  get showAdminDashboardLink(): boolean {
    return this.launch?.userHydrated && (this.ethereumService.defaultAccountAddress === this.launch?.admin);
  }

  formatLink(link: string): string {
    return this.launchService.formatLink(link);
  }
}
