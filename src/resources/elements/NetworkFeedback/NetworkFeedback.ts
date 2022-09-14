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
    if (locallyStoredNetwork) {
      const defaultNetwork = this.isProductionEnv ? Networks.Mainnet : Networks.Rinkeby;

      const invalidlyStoredTestnet = this.isProductionEnv
        && [Networks.Rinkeby, Networks.Alfajores, Networks.Kovan].includes(locallyStoredNetwork);
      const invalidlyStoredMainnet = !this.isProductionEnv
        && [Networks.Mainnet, Networks.Celo, Networks.Arbitrum].includes(locallyStoredNetwork);
      const illegalNetwork = (invalidlyStoredTestnet || invalidlyStoredMainnet);

      if (illegalNetwork) {
        this.network = defaultNetwork;
        this.storageService.lsSet("network", `${defaultNetwork}`);
      }
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
