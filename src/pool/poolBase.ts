import { BindingSignaler } from "aurelia-templating-resources";
import { autoinject, computedFrom } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { Address, EthereumService} from "services/EthereumService";
import { EventConfigException } from "services/GeneralEvents";
import { PoolService } from "services/PoolService";
import { Pool } from "entities/pool";
import { Utils } from "services/utils";
import { DisposableCollection } from "services/DisposableCollection";

/**
 * base class for views that work with a pool, given `poolAddress` in the route model
 */
@autoinject
export abstract class PoolBase {
  protected poolAddress: Address;
  protected pool: Pool;
  @computedFrom("pool.connected")
  protected get connected(): boolean { return this.pool?.connected; }
  protected subscriptions: DisposableCollection = new DisposableCollection();

  constructor(
    protected eventAggregator: EventAggregator,
    protected ethereumService: EthereumService,
    protected poolService: PoolService,
    protected signaler: BindingSignaler) {
  }

  protected activate(model: { poolAddress: Address }): void {
    this.poolAddress = model.poolAddress;
    if (this.pool && (this.pool.address !== this.poolAddress)) {
      throw new Error("internal error: cannot change pool address");
    }
  }

  deactivate(): void {
    this.subscriptions.dispose();
  }

  protected async attached(): Promise<void> {
    await this.initialize();
  }

  protected async initialize(): Promise<void> {
    if (!this.pool) {
      try {

        if (this.poolService.initializing) {
          await Utils.sleep(200);
          this.eventAggregator.publish("pools.loading", true);
          await this.poolService.ensureInitialized();
        }
        this.pool = this.poolService.pools.get(this.poolAddress);
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        this.eventAggregator.publish("pools.loading", false);
      }
    }
  }

  protected async refresh(full = false): Promise<void> {
    if (this.pool) {
      try {
        this.eventAggregator.publish("pools.loading", true);
        await this.pool.refresh(full);
        this.signaler.signal("userBalancesChanged");
        this.signaler.signal("poolBalancesChanged");
        this.signaler.signal("updatePoolTokenChange");
        this.signaler.signal("updateSlippage");
        this.signaler.signal("updateShowTokenUnlock");
      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        this.eventAggregator.publish("pools.loading", false);
      }
    }
  }

  protected async getUserBalances(suppressModalLockout = true): Promise<void> {

    if (this.pool && this.ethereumService.defaultAccountAddress) {
      try {
        if (!suppressModalLockout) {
          // timeout to allow styles to load on startup to modalscreen sizes correctly
          setTimeout(() => this.eventAggregator.publish("pools.loading", true), 100);
        }
        /**
         * TODO: add "force" argument to control whether to refresh values that already exist
         */
        await this.pool.hydrateUserValues();
        this.signaler.signal("userBalancesChanged");
        this.signaler.signal("updatePoolTokenChange");
        this.signaler.signal("updateShowTokenUnlock");
        this.signaler.signal("updateSlippage");

      } catch (ex) {
        this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
      }
      finally {
        if (!suppressModalLockout) {
          this.eventAggregator.publish("pools.loading", false);
        }
      }
    }
  }

  protected ensureConnected(): boolean {
    return this.pool?.ensureConnected();
  }
}
