import { autoinject, containerless, customElement } from "aurelia-framework";
import { AllowedNetworks, EthereumService, isCeloNetworkLike, Networks } from "services/EthereumService";
import { BrowserStorageService } from "services/BrowserStorageService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: AllowedNetworks;
  private isProductionEnv;
  private show: boolean;
  private Networks = Networks;

  constructor(
    private ethereumService: EthereumService,
    private storageService: BrowserStorageService,
  ) {
    this.network = EthereumService.targetedNetwork;
    this.show = false;

    this.isProductionEnv = process.env.NODE_ENV !== "development" || process.env.NETWORK === Networks.Mainnet;
    const locallyStoredNetwork = this.storageService.lsGet<AllowedNetworks>("network");
    const isLocallyMainnet = [Networks.Mainnet, Networks.Celo, Networks.Arbitrum].includes(locallyStoredNetwork);
    const isLocallyTestnet = [Networks.Rinkeby, Networks.Alfajores, Networks.Kovan].includes(locallyStoredNetwork);
    if (
      locallyStoredNetwork &&
      ((this.isProductionEnv && isLocallyTestnet) || (!this.isProductionEnv && isLocallyMainnet))
    ) {
      /**
      * If stored network is illegal, should be treated as if not selected yet,
      * thus Ethereum network is the default.
      */
      this.network = this.isProductionEnv ? Networks.Mainnet : Networks.Rinkeby;
      this.storageService.lsSet("network", `${this.network}`);
    }
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
