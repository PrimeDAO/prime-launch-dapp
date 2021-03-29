import { PLATFORM } from "aurelia-pal";
import { Router, RouterConfiguration } from "aurelia-router";
import { autoinject, singleton } from "aurelia-framework";
import { Pool } from "entities/pool";
import { Address } from "services/EthereumService";
import { PoolService } from "services/PoolService";
// import { Router } from "aurelia-router";
// import { EventAggregator } from "aurelia-event-aggregator";
// import { EthereumService } from "services/EthereumService";
// import { PoolService } from "services/PoolService";

@singleton(false)
@autoinject
export class Overview {
  pool: Pool;
  router: Router;

  constructor(
    private poolService: PoolService) {
  }

  protected async activate(model: { poolAddress: Address }): Promise<void> {
    this.pool = this.poolService.pools.get(model.poolAddress);
  }

  private configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      {
        route: "",
        redirect: "story",
      }
      , {
        moduleId: PLATFORM.moduleName("./story/story"),
        name: "story",
        route: "story",
      }
      , {
        moduleId: PLATFORM.moduleName("./add/add"),
        name: "add",
        route: "add",
        title: "Buy",
      }
      , {
        moduleId: PLATFORM.moduleName("./remove/remove"),
        name: "remove",
        route: "remove",
        title: "Redeem",
      },
      // , {
      //   moduleId: PLATFORM.moduleName("./staking/staking"),
      //   name: "staking",
      //   route: ["staking"],
      //   title: "Staking",
      // }
    ]);

    this.router = router;
  }
}
