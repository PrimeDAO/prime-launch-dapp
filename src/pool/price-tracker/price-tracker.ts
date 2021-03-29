import { Pool } from "entities/pool";
import { Address } from "services/EthereumService";
import { PoolService } from "services/PoolService";
import { autoinject, singleton } from "aurelia-framework";

@singleton(false)
@autoinject
export class PriceTracker {
  pool: Pool;
  data: Array<any>
  loading = true;

  constructor(
    private poolService: PoolService) {
  }

  protected activate(model: { poolAddress: Address }): void {
    this.loading = true;
    this.pool = this.poolService.pools.get(model.poolAddress);
    setTimeout(async () => {
      try {
        this.data = await this.pool.getMarketCapHistory();
      } finally {
        this.loading = false;
      }
    }, 0);
  }
}
