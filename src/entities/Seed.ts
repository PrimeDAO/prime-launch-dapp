import { autoinject, computedFrom } from "aurelia-framework";
import { DateService } from "./../services/DateService";
import { ContractsService, ContractNames } from "./../services/ContractsService";
import { BigNumber } from "ethers";
import { Address } from "services/EthereumService";
import { EventConfigFailure } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";

export interface ISeedConfiguration {
  address: Address;
  beneficiary: Address;
}

@autoinject
export class Seed {
  contract: any;
  address: Address;
  beneficiary: Address;
  startTime: Date;
  endTime: Date;
  price: BigNumber;
  target: BigNumber;
  cap: BigNumber;
  seedToken: Address;
  fundingToken: Address;

  public initializing = true;
  private initializedPromise: Promise<void>;

  @computedFrom("startTime")
  get startsInDays(): number { return this.dateService.getDurationBetween(this.startTime, new Date()).asDays(); }

  constructor(
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService,
    private dateService: DateService,
  ) {}

  public async initialize(config: ISeedConfiguration): Promise<Seed> {
    Object.assign(this, config);

    this.contract = await this.contractsService.getContractAtAddress(ContractNames.SEED, this.address);

    this.hydrate();

    return this;
  }

  private async hydrate(): Promise<void> {
    return this.initializedPromise = new Promise(
      // eslint-disable-next-line no-async-promise-executor
      async (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): Promise<void> => {
        setTimeout(async () => {
          try {
            this.startTime = this.dateService.unixEpochToDate(await this.contract.startTime());
            this.endTime = this.dateService.unixEpochToDate(await this.contract.endTime());
            this.price = await this.contract.price();
            this.target = await this.contract.successMinimum();
            this.cap = await this.contract.cap();
            this.seedToken = await this.contract.seedToken();
            this.fundingToken = await this.contract.fundingToken();
            this.initializing = false;
            resolve();
          }
          catch (error) {
            this.consoleLogService.handleFailure(
              new EventConfigFailure(`Seed: Error hydrating seed data ${error?.message}`));
            this.initializing = false;
            reject();
          }
        }, 100);
      });
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }
}
