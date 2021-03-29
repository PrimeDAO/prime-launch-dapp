import { autoinject } from "aurelia-framework";
import axios from "axios";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { Container } from "aurelia-dependency-injection";
import { Address, EthereumService } from "services/EthereumService";
import { Pool } from "../entities/pool";

interface IPoolConfigInternal {
  /**
   * one address for each chain
   */
  addresses: Array<{ [network: string]: string }>;
  description: string;
  icon: string;
  name: string;
  preview: boolean;
  story: string;
}

export interface IPoolConfig {
  /**
   * crPool address
   */
  address: Address;
  description: string;
  /**
   * SVG icon for the pool
   */
  icon: string;
  name: string;
  /**
   * the pool doesn't actually exist yet, but we want to present a preview in the UI
   */
  preview: boolean;
  story: string;
}

@autoinject
export class PoolService {

  public pools: Map<Address, Pool>;
  public get poolsArray(): Array<Pool> {
    return Array.from(this.pools.values());
  }
  public initializing = true;
  private initializedPromise: Promise<void>;

  constructor(
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private container: Container,
  ) {
    /**
     * otherwise singleton is the default
     */
    this.container.registerTransient(Pool);
  }

  public async initialize(): Promise<void> {
    return this.createPools();
  }

  private createPools(): Promise<void> {
    return this.initializedPromise = new Promise(
      (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): Promise<void> => {
        if (!this.pools?.size) {
          return axios.get("https://raw.githubusercontent.com/PrimeDAO/prime-pool-dapp/master/src/poolConfigurations/pools.json")
            .then(async (response) => {
              const poolsMap = new Map<Address, Pool>();
              for (const config of response.data as Array<IPoolConfigInternal>) {
                const pool = await this.createPoolFromConfig(config);
                // assign random key to preview pools
                poolsMap.set(pool.preview ? Math.random().toString() : pool.address, pool);
              }
              this.pools = poolsMap;
              this.initializing = false;
              return resolve();
            })
            .catch((error) => {
              this.pools = new Map();
              this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", error));
              this.initializing = false;
              return reject();
            });
        }
      });
  }

  private createPoolFromConfig(config: IPoolConfigInternal): Promise<Pool> {
    const poolConfig = {
      address: config.addresses[this.ethereumService.targetedNetwork],
      description: config.description,
      icon: config.icon,
      name: config.name,
      preview: config.preview,
      story: config.story,
    };
    const pool = this.container.get(Pool);
    return pool.initialize(poolConfig);
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }
}
