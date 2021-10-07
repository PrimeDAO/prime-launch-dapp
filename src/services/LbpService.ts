import { Lbp } from "entities/Lbp";
import { autoinject, computedFrom } from "aurelia-framework";
import { Address } from "services/EthereumService";
import { TokenService } from "services/TokenService";
import { AureliaHelperService } from "services/AureliaHelperService";
import { EthereumService, Networks } from "services/EthereumService";
import TransactionsService from "services/TransactionsService";
import { IpfsService } from "./IpfsService";
import { ConsoleLogService } from "./ConsoleLogService";
import { Container } from "aurelia-dependency-injection";
import { EventAggregator } from "aurelia-event-aggregator";
import { ContractNames, ContractsService, IStandardEvent } from "services/ContractsService";
import { EventConfigException } from "services/GeneralEvents";

export interface ILbpCreatedEventArgs {
  newLbp: Address;
  beneficiary: Address;
}

@autoinject
export class LbpService {

  public lbps: Map<Address, Lbp>;
  public static lbpFee = 0.0; // If the value is ever > 0, then should be a fraction like 0.1 to represent 1%

  @computedFrom("lbps.size")
  public get lbpsArray(): Array<Lbp> {
    return this.lbps ? Array.from(this.lbps.values()) : [];
  }

  public initializing = true;

  private lbpFactory: any;
  private initializedPromise: Promise<void>;
  /**
   * when the factory was created, pulled by hand from etherscan.io
   */
  private startingBlockNumber: number;

  constructor(
    private contractsService: ContractsService,
    private eventAggregator: EventAggregator,
    private container: Container,
    private consoleLogService: ConsoleLogService,
    private transactionsService: TransactionsService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
    private aureliaHelperService: AureliaHelperService,
    private tokenService: TokenService,
  ) {
    /**
     * otherwise singleton is the default
     */
    this.container.registerTransient(Lbp);

    this.eventAggregator.subscribe("Lbp.InitializationFailed", async (lbpAddress: string) => {
      this.lbps.delete(lbpAddress);
    });

    this.startingBlockNumber = (this.ethereumService.targetedNetwork === Networks.Mainnet) ?
      12787753 : 8896151;
  }


  public async initialize(): Promise<void> {
    // disabled for now
    // if (!this.featuredSeedsJson) {
    //   // eslint-disable-next-line require-atomic-updates
    //   if (process.env.NODE_ENV === "development") {
    //     this.featuredSeedsJson = require("../configurations/featuredSeeds.json");
    //   } else {
    //     axios.get("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/src/configurations/featuredSeeds.json")
    //       .then((response) => this.featuredSeedsJson = response.data);
    //   }
    // }

    /**
     * don't need to reload the seedfactory on account change because we never send txts to it.
     */
    this.lbpFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    /**
     * seeds will take care of themselves on account changes
     */
    return this.getLbps();
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  public async ensureAllLbpsInitialized(): Promise<void> {
    await this.ensureInitialized();
    for (const lbp of this.lbpsArray) {
      await lbp.ensureInitialized();
    }
  }


  private async getLbps(): Promise<void> {
    return this.initializedPromise = new Promise(
      (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): void => {
        if (!this.lbps?.size) {
          try {
            const lbpsMap = new Map<Address, Lbp>();
            const filter = this.lbpFactory.filters.SeedCreated();
            this.lbpFactory.queryFilter(filter, this.startingBlockNumber)
              .then(async (txEvents: Array<IStandardEvent<ILbpCreatedEventArgs>>) => {
                // for (const event of txEvents) {
                //   const lbp = this.createLbpFromConfig(event);
                //   lbpsMap.set(lbp.address, lbp);
                //   /**
                //    * remove the seed if it is corrupt
                //    */
                //   this.aureliaHelperService.createPropertyWatch(lbp, "corrupt", (newValue: boolean) => {
                //     if (newValue) { // pretty much the only case
                //       this.lbps.delete(lbp.address);
                //     }
                //   });
                //   this.consoleLogService.logMessage(`loaded seed: ${lbp.address}`, "info");
                //   lbp.initialize(); // set this off asyncronously.
                // }
                this.lbps = lbpsMap;
                this.initializing = false;
                resolve();
              });
          }
          catch (error) {
            this.lbps = new Map();
            this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", error));
            this.initializing = false;
            reject();
          }
        }
      },
    );
  }

  private createLbpFromConfig(config: IStandardEvent<ILbpCreatedEventArgs>): Lbp {
    const lbp = this.container.get(Lbp);
    return lbp.create({ beneficiary: config.args.beneficiary, address: config.args.newLbp });
  }

}
