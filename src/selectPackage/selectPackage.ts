import { RouteConfig } from "aurelia-router";
import { SeedService } from "services/SeedService";
import "./selectPackage.scss";

export class SelectPackage {
  private seedFee: number;
  private nextRoute = "launch";

  constructor() {
    this.seedFee = SeedService.seedFee * 100;
  }

  activate(params: any, routeConfig: RouteConfig): void {
    this.nextRoute = routeConfig.route.toString().split("/")[0];
  }
}
