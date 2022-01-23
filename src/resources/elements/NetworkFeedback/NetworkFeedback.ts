import { autoinject, containerless, customElement } from "aurelia-framework";
import { EthereumService } from "services/EthereumService";

@autoinject
@containerless
@customElement("networkfeedback")

export class NetworkFeedback {

  private network: string;
  private isTestNet;

  constructor(private ethereumService: EthereumService) {
    this.network = EthereumService.targetedNetwork;
    this.isTestNet = EthereumService.isTestNet;
  }
}
