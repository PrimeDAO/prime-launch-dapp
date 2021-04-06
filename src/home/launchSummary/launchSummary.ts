import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { bindable } from "aurelia-typed-observable-plugin";
import { Address } from "services/EthereumService";
import "./launchSummary.scss";

@autoinject
export class LaunchSummary {

  @bindable address: Address;

  constructor(
    private router: Router,
  ) {}

  gotoDashboard(): void {
    this.router.navigate(`seedDashboard/${this.address}`);
  }
}
