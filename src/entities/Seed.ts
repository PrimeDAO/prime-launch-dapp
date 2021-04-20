import { ITokenInfo } from "./../services/TokenService";
import { autoinject, computedFrom } from "aurelia-framework";
import { DateService } from "./../services/DateService";
import { ContractsService, ContractNames } from "./../services/ContractsService";
import { BigNumber } from "ethers";
import { Address } from "services/EthereumService";
import { EventConfigFailure } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";
import { TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";

export interface ISeedConfiguration {
  address: Address;
  beneficiary: Address;
}

@autoinject
export class Seed {
  public contract: any;
  public address: Address;
  public beneficiary: Address;
  public startTime: Date;
  public endTime: Date;
  public price: BigNumber;
  public target: BigNumber;
  public cap: BigNumber;
  public whitelisted: boolean;
  public vestingDuration: number;
  public vestingCliff: number;
  public minimumReached: boolean;

  public seedTokenAddress: Address;
  public seedTokenInfo: ITokenInfo;
  public seedTokenContract: any;

  public fundingTokenAddress: Address;
  public fundingTokenInfo: ITokenInfo;
  public fundingTokenContract: any;

  public initializing = true;

  private initializedPromise: Promise<void>;
  private subscriptions = new DisposableCollection();
  private _now = new Date();

  @computedFrom("_now")
  public get startsInMilliseconds(): number {
    return this.dateService.getDurationBetween(this.startTime, this._now).asMilliseconds();
  }

  @computedFrom("_now")
  public get isActive(): boolean {
    return (this.startTime >= this._now) && (this._now < this.endTime);
  }

  constructor(
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService,
    private eventAggregator: EventAggregator,
    private dateService: DateService,
    private tokenService: TokenService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (state: {now: Date}) => {
      this._now = state.now;
    }));
  }

  /**
   * note this is called when the contracts change
   * @param config
   * @returns
   */
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
            this.startTime = this.dateService.unixEpochToDate((await this.contract.startTime()).toNumber());
            this.endTime = this.dateService.unixEpochToDate((await this.contract.endTime()).toNumber());
            this.price = await this.contract.price();
            this.target = await this.contract.successMinimum();
            this.cap = await this.contract.cap();
            this.seedTokenAddress = await this.contract.seedToken();
            this.whitelisted = await this.contract.isWhitelisted();
            this.fundingTokenAddress = await this.contract.fundingToken();
            this.vestingDuration = await this.contract.vestingDuration();
            this.vestingCliff = await this.contract.vestingCliff();
            this.minimumReached = await this.contract.minimumReached();

            this.seedTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.seedTokenAddress);
            this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.fundingTokenAddress);

            this.seedTokenContract = this.tokenService.getTokenContract(this.seedTokenAddress);
            this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);

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

  public userIsWhitelisted(account: Address): Promise<boolean> {
    return !this.whitelisted || this.contract.checkWhitelisted(account);
  }

  public async userClaimableAmount(account: Address): Promise<BigNumber> {
    return (await this.contract.calculateClaim(account))[1];
  }

  public async userCanClaim(account: Address): Promise<boolean> {
    return BigNumber.from((await this.userClaimableAmount(account))).gt(0);
  }
}
