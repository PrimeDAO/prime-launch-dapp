import { BindingSignaler } from "aurelia-templating-resources";
import { PLATFORM } from "aurelia-pal";
import { autoinject, singleton } from "aurelia-framework";
import "./pool.scss";
import { PoolBase } from "./poolBase";
import { EventAggregator } from "aurelia-event-aggregator";
import { EthereumService } from "services/EthereumService";
import { PoolService } from "services/PoolService";
import { Router, RouterConfiguration } from "aurelia-router";

@singleton(false)
@autoinject
export class PoolDashboard extends PoolBase {
  router: Router;
  constructor(
    eventAggregator: EventAggregator,
    ethereumService: EthereumService,
    signaler: BindingSignaler,
    poolService: PoolService) {
    super(eventAggregator, ethereumService, poolService, signaler);
  }

  private configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      {
        route: "",
        redirect: "overview",
      }
      , {
        moduleId: PLATFORM.moduleName("./overview/overview"),
        nav: true,
        name: "overview",
        route: "overview",
        title: "Overview",
      }
      , {
        moduleId: PLATFORM.moduleName("./details/details"),
        nav: true,
        name: "details",
        route: "details",
        title: "Details",
      }
      , {
        moduleId: PLATFORM.moduleName("./price-tracker/price-tracker"),
        nav: true,
        name: "priceTracker",
        route: "priceTracker",
        title: "Price Tracker",
      },
    ]);

    config.fallbackRoute("overview");
    this.router = router;
  }
}
