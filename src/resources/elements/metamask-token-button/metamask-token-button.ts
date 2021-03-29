import { EventAggregator } from "aurelia-event-aggregator";
import { computedFrom, autoinject, bindable, containerless} from "aurelia-framework";
import { EventConfigException } from "services/GeneralEvents";
import { ITokenInfo } from "services/TokenService";
import "./metamask-token-button.scss";

@containerless
@autoinject
export class MetamaskTokenButton {

  @bindable tokenInfo: ITokenInfo;

  constructor(private eventAggregator: EventAggregator) {
  }

  @computedFrom("window.ethereum", "tokenInfo")
  get showMMButton(): boolean {
    return !!window.ethereum && !!this.tokenInfo;
  }

  async addToMetamask(): Promise<void> {
    /**
     * from: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-747.md
     */
    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      // const wasAdded =
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20", // Initially only supports ERC20, but eventually more!
          options: {
            address: this.tokenInfo.address, // The address that the token is at.
            symbol: this.tokenInfo.symbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: 18, // The number of decimals in the token
            image: this.tokenInfo.icon, // A string url of the token logo
          },
        },
      });

    } catch (error) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an unexpected error occurred", error));
    }
  }
}
