import { autoinject, containerless, customElement } from "aurelia-framework";
import { AllowedNetworks, EthereumService, Networks } from "services/EthereumService";
import { BrowserStorageService } from "services/BrowserStorageService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: AllowedNetworks;
  private isProduction;
  private show: boolean;

  constructor(
    private ethereumService: EthereumService,
    private storageService: BrowserStorageService,
  ) {
    this.network = EthereumService.targetedNetwork;
    this.show = false;
  }

  setShow(): void {
    this.show = !this.show;
  }

  getIconName(): string {
    return (this.network === Networks.Celo || this.network === Networks.Alfajores) ? "celo" : "eth";
  }

  async onDropDownItemClick(item: AllowedNetworks): Promise<void> {
    this.storageService.lsSet("network", `${item}`);
    window.location.reload();
  }

  attached() {
    this.isProduction = process.env.NODE_ENV !== "development";
  }

  isActive(item: AllowedNetworks): boolean {
    return this.network === item;
  }
}
