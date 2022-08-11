import { autoinject, containerless, customElement } from "aurelia-framework";
import { AllowedNetworks, EthereumService } from "services/EthereumService";
import LocalStorageService from "services/LocalStorageService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: string;
  private etheriumNetwork: string
  private isTestNet;
  private show: boolean


  constructor(private ethereumService: EthereumService) {
    this.etheriumNetwork = process.env.NETWORK;
    this.network = EthereumService.targetedNetwork;
    this.isTestNet = EthereumService.isTestNet;
    this.show = false;
  }

  setShow(): void {
    this.show = !this.show;
  }

  getIconName(): string {
    return this.network === "celo" ? "celo" : "eth";
  }

  async onDropDownItemClick(item: AllowedNetworks): Promise<void> {
    LocalStorageService.set<AllowedNetworks>("network", `${item}`);
    window.location.reload();
    this.network = EthereumService.targetedNetwork;
    this.show = false;
  }

  isActive(item: AllowedNetworks): boolean {
    return this.network === item;
  }
}
