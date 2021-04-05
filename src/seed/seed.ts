import { bindable } from "aurelia-typed-observable-plugin";
import { Address } from "services/EthereumService";
import "./seed.scss";

export class Seed {
  @bindable address: Address;

  activate(params: { address: Address}): void {
    this.address = params.address;
  }
}
