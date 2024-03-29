import { autoinject, containerless, customElement } from "aurelia-framework";
import { AllowedNetworks, EthereumService, isCeloNetworkLike, isLocalhostUrl, isMainnet, Networks } from "services/EthereumService";
import { BrowserStorageService } from "services/BrowserStorageService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: AllowedNetworks;
  private envIsMainnet: boolean;
  private show: boolean;
  private Networks = Networks;

  private isLocalhostUrl = isLocalhostUrl

  constructor(
    private ethereumService: EthereumService,
    private storageService: BrowserStorageService,
  ) {
    this.network = EthereumService.targetedNetwork;
    this.show = false;

    this.envIsMainnet = isMainnet(process.env.NETWORK as AllowedNetworks);
    this.network = EthereumService.targetedNetwork;
  }

  setShow(): void {
    this.show = !this.show;
  }

  getIconName(): string {
    return isCeloNetworkLike(this.network) ? "celo" : "eth";
  }

  async onDropDownItemClick(item: AllowedNetworks): Promise<void> {
    this.storageService.lsSet("network", `${item}`);
    window.location.reload();
  }

  isActive(item: AllowedNetworks): boolean {
    return this.network === item;
  }
}
