import { ITokenInfo } from "./../services/TokenService";
import { autoinject, computedFrom } from "aurelia-framework";
import { DateService } from "./../services/DateService";
import { ContractsService, ContractNames } from "./../services/ContractsService";
import { BigNumber } from "ethers";
import { Address, EthereumService, fromWei } from "services/EthereumService";
import { EventConfigFailure } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";
import { TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { NumberService } from "services/numberService";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";

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
  /**
   * The number of fundingTokens required to receive one seedToken,
   * ie, the price of one seed token in units of funding tokens.
   */
  public fundingTokensPerSeedToken: number;
  /**
   * The $ price of fundingTokensPerSeedToken
   */
  public fundingTokenPricePerSeedToken: number;
  /**
   * in terms of fundingToken
   */
  public target: BigNumber;
  public targetPrice: number;
  /**
   * in terms of fundingToken
   */
  public cap: BigNumber;
  public capPrice: number;
  public whitelisted: boolean;
  /**
   * the number of days of which seed tokens vest
   */
  public vestingDuration: number;
  /**
   * the initial period in days of the vestingDuration during which seed tokens may not
   * be redeemd
   */
  public vestingCliff: number;
  public minimumReached: boolean;
  /**
   * the amount of the fundingToken in the seed
   */
  public amountRaised: BigNumber;

  public seedTokenAddress: Address;
  public seedTokenInfo: ITokenInfo;
  public seedTokenContract: any;

  public fundingTokenAddress: Address;
  public fundingTokenInfo: ITokenInfo;
  public fundingTokenContract: any;

  public userIsWhitelisted: boolean;
  public userClaimableAmount: BigNumber;
  public userCanClaim: boolean;

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
    private transactionsService: TransactionsService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (state: {now: Date}) => {
      this._now = state.now;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.loadContracts().then(() => { this.hydrateUser(); });
    }));
  }

  /**
   * note this is called when the contracts change
   * @param config
   * @returns
   */
  public async initialize(config: ISeedConfiguration): Promise<Seed> {
    Object.assign(this, config);


    await this.loadContracts();
    /**
     * no, intentionally don't await
     */
    this.hydrate();

    return this;
  }

  private async loadContracts(): Promise<void> {
    this.contract = await this.contractsService.getContractAtAddress(ContractNames.SEED, this.address);
    if (this.seedTokenAddress) {
      this.seedTokenContract = this.tokenService.getTokenContract(this.seedTokenAddress);
      this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);
    }
  }

  private async hydrate(): Promise<void> {
    this.initializing = true;
    return this.initializedPromise = new Promise(
      // eslint-disable-next-line no-async-promise-executor
      async (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): Promise<void> => {
        setTimeout(async () => {
          try {
            this.seedTokenAddress = await this.contract.seedToken();
            this.fundingTokenAddress = await this.contract.fundingToken();

            this.seedTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.seedTokenAddress);
            this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.fundingTokenAddress);

            this.seedTokenContract = this.tokenService.getTokenContract(this.seedTokenAddress);
            this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);

            this.amountRaised = await this.fundingTokenContract.balanceOf(this.address);

            this.startTime = this.dateService.unixEpochToDate((await this.contract.startTime()).toNumber());
            this.endTime = this.dateService.unixEpochToDate((await this.contract.endTime()).toNumber());
            this.fundingTokensPerSeedToken = this.numberService.fromString(fromWei(await this.contract.price()));
            this.fundingTokenPricePerSeedToken = this.fundingTokensPerSeedToken * (this.fundingTokenInfo.price ?? 0);
            /**
             * in terms of fundingTken
             */
            this.target = await this.contract.successMinimum();
            this.targetPrice = this.numberService.fromString(fromWei(this.target)) * (this.fundingTokenInfo.price ?? 0);
            /**
             * in terms of fundingTken
             */
            this.cap = await this.contract.cap();
            this.capPrice = this.numberService.fromString(fromWei(this.cap)) * (this.fundingTokenInfo.price ?? 0);
            this.whitelisted = await this.contract.isWhitelisted();
            this.vestingDuration = await this.contract.vestingDuration();
            this.vestingCliff = await this.contract.vestingCliff();
            this.minimumReached = await this.contract.minimumReached();
            await this.hydrateUser();

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

  private async hydrateUser(): Promise<void> {
    const account = this.ethereumService.defaultAccountAddress;

    if (account) {
      this.userIsWhitelisted = !this.whitelisted || (await this.contract.checkWhitelisted(account));
      this.userClaimableAmount = (await this.contract.calculateClaim(account))[1];
      this.userCanClaim = this.userClaimableAmount.gt(0);
    }
  }

  public buy(amount: BigNumber): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.buy(amount))
      .then((receipt) => {
        if (receipt) {
          this.hydrateUser();
          return receipt;
        }
      });
  }

  public claim(): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.claimLock(this.ethereumService.defaultAccountAddress))
      .then((receipt) => {
        if (receipt) {
          this.hydrateUser();
          return receipt;
        }
      });
  }
}
