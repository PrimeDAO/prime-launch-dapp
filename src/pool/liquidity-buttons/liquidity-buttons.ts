import { Router } from "aurelia-router";
import { autoinject, bindable } from "aurelia-framework";
import { Pool } from "entities/pool";
import { EthereumService } from "services/EthereumService";

@autoinject
export class LiquidityButtons {

  @bindable pool: Pool;

  constructor(
    private router: Router,
    private ethereumService: EthereumService) {
  }

  gotoAddLiquidity(): void {
    if (this.pool.connected) {
      this.router.navigate(`/pool/${this.pool.address}/overview/add`);
    }
  }

  gotoRemoveLiquidity(): void {
    if (this.pool.connected) {
      this.router.navigate(`/pool/${this.pool.address}/overview/remove`);
    }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
