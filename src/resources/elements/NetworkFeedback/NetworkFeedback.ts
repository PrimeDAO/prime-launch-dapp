import { Aurelia, autoinject, containerless, customElement } from "aurelia-framework";
import { AllowedNetworks, EthereumService } from "services/EthereumService";
import LocalStorageService from "services/LocalStorageService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: string;
  private isTestNet;
  private show: boolean
  private networkItem: AllowedNetworks
  private aurelia: Aurelia
  private isCelo: boolean;

  constructor(private ethereumService: EthereumService) {
    this.network = EthereumService.targetedNetwork;
    this.isTestNet = EthereumService.isTestNet;
    this.show = false;
    this.networkItem = this.network === EthereumService.targetedNetwork ? "celo" : EthereumService.targetedNetwork;
    this.isCelo = this.network === "celo";
  }

  setShow(): void {
    this.show = !this.show;
  }

  async onDropDownItemClick(): Promise<void> {
    LocalStorageService.set<AllowedNetworks>("network", `${this.networkItem}`);
    window.location.reload();
    this.network = EthereumService.targetedNetwork;
    this.show = false;
    this.networkItem = this.networkItem === "rinkeby" ? "celo" : "rinkeby";
  }
}
