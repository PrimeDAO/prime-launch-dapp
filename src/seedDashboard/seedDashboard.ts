import { bindable } from "aurelia-typed-observable-plugin";
import { Address } from "services/EthereumService";
import "./seedDashboard.scss";

export class SeedDashboard {
  @bindable address: Address;

  activate(params: { address: Address}): void {
    this.address = params.address;
  }
}
