import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, customElement } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { EnsService } from "services/EnsService";
import { EthereumService } from "../../../services/EthereumService";

@autoinject
@customElement("smallusersaddress")
export class UsersAddress {

  @bindable.booleanAttr small?: boolean;
  @bindable.booleanAttr showEns?: boolean;

  private usersAddress: string;
  private ens?: string;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private ensService: EnsService,
  ) {
    this.eventAggregator.subscribe("Network.Changed.Account", () => { this.initialize(); });
  }

  attached(): void {
    this.initialize();
  }

  private async initialize() {
    this.usersAddress = this.ethereumService.defaultAccountAddress;
    if (this.usersAddress && this.showEns) {
      this.ens = await this.ensService.getEnsForAddress(this.usersAddress);
    }
  }
}
