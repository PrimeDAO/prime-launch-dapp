import { RouteConfig } from "aurelia-router";
import { SeedService } from "services/SeedService";
import "./selectPackage.scss";

export class SelectPackage {
  private launchFee: number;
  private nextRoute;

  constructor() {
    this.launchFee = SeedService.seedFee * 100;
  }

  activate(_params: unknown, routeConfig: RouteConfig): void {
    this.nextRoute = routeConfig.route.toString().split("/")[0];
  }
}
