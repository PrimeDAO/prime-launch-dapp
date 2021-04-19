import { Container } from "aurelia-dependency-injection";
import { ContractNames, ContractsService, IStandardEvent } from "./ContractsService";
import { autoinject } from "aurelia-framework";
import { Address } from "services/EthereumService";
import { Seed } from "entities/Seed";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { DisposableCollection } from "services/DisposableCollection";

// export interface ISeed {
//   address: Address;
//   description: string;
//   /**
//    * SVG icon for the pool
//    */
//   icon: string;
//   name: string;
//   /**
//    * the pool doesn't actually exist yet, but we want to present a preview in the UI
//    */
//   preview: boolean;
//   story: string;
// }

export interface ISeedCreatedEventArgs {
  newSeed: Address;
  beneficiary: Address;
}

/**
 * see SeedFactory contract for docs of these params
 */
// export interface IDeploySeedParams {
//   admin: Address;
//   seedToken: Address;
//   fundingToken: Address;
//   successMinimumAndCap: Array<BigNumber>;
//   fee: BigNumber;
//   price: BigNumber;
//   startTime: number;
//   endTime: number;
//   vestingDuration: number;
//   vestingCliff: number;
//   isWhitelisted: boolean;
// }

@autoinject
export class SeedService {

  public seeds: Map<Address, Seed>;
  public get seedsArray(): Array<Seed> {
    return Array.from(this.seeds?.values());
  }
  public initializing = true;
  private initializedPromise: Promise<void>;
  private subscriptions: DisposableCollection = new DisposableCollection();
  private seedFactory: any;
  /**
   * when the factory was created
   */
  // private startingBlockNumber: number;

  constructor(
    private contractsService: ContractsService,
    // private transactionsService: TransactionsService,
    private eventAggregator: EventAggregator,
    private container: Container,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.loadContracts();
      this.getSeeds();
    }));
    /**
     * otherwise singleton is the default
     */
    this.container.registerTransient(Seed);
  }

  private async loadContracts(): Promise<void> {
    this.seedFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
  }

  public async initialize(): Promise<void> {
    await this.loadContracts();
    return this.getSeeds();
  }

  // async hydrateStartingBlock(): Promise<void> {
  //   const filter = this.seedFactory.filters.SeedCreated(undefined, this.address);
  //   const txEvents: Array<IStandardEvent<unknown>> = await this.seedFactory.queryFilter(filter);
  //   this.startingBlockNumber = txEvents[0].blockNumber;
  //   // const block = await this.ethereumService.getBlock(this.startingBlockNumber);
  //   // this.startingDateTime = block.blockDate;
  // }

  private async getSeeds(): Promise<void> {
    return this.initializedPromise = new Promise(
      (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): void => {
        if (!this.seeds?.size) {
          try {
            const seedsMap = new Map<Address, Seed>();
            const filter = this.seedFactory.filters.SeedCreated();
            this.seedFactory.queryFilter(filter /*, this.startingBlockNumber */)
              .then(async (txEvents: Array<IStandardEvent<ISeedCreatedEventArgs>>) => {
                for (const event of txEvents) {
                  /**
                     * TODO: This should also pull the full seed configuration from whereever we are storing it
                     */
                  await this.createSeedFromConfig(event)
                    .then((seed) => { seedsMap.set(seed.address, seed); } );
                }
                this.seeds = seedsMap;
                this.initializing = false;
                resolve();
              });
          }
          catch (error) {
            this.seeds = new Map();
            this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", error));
            this.initializing = false;
            reject();
          }
        }
      },
    );
  }

  private createSeedFromConfig(config: IStandardEvent<ISeedCreatedEventArgs>): Promise<Seed> {
    const seed = this.container.get(Seed);
    return seed.initialize({ beneficiary: config.args.beneficiary, address: config.args.newSeed });
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  // public async deploySeed(params: IDeploySeedParams): Promise<TransactionReceipt> {
  //   const factoryContract = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);

  //   return this.transactionsService.send(factoryContract.deploySeed(
  //     params.admin,
  //     params.seedToken,
  //     params.fundingToken,
  //     params.successMinimumAndCap,
  //     params.price,
  //     params.startTime,
  //     params.endTime,
  //     params.vestingDuration,
  //     params.vestingCliff,
  //     params.isWhitelisted,
  //     params.fee,
  //   ));
  // }
}
