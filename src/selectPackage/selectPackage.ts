import { RouteConfig } from "aurelia-router";
import { SeedService } from "services/SeedService";
import "./selectPackage.scss";

export class SelectPackage {
  private launchFee: number;
  private nextRoute = "launch";

  constructor() {
    this.launchFee = SeedService.launchFee * 100;
  }

  activate(params: any, routeConfig: RouteConfig): void {
    this.nextRoute = routeConfig.route.toString().split("/")[0];
  }
}
