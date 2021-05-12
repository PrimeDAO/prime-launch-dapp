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
import { Utils } from "services/utils";

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
  public maximumReached: boolean;
  /**
   * the amount of the fundingToken in the seed
   */
  public amountRaised: BigNumber;
  /**
   * $ value of the total supply of the seed token
   */
  public valuation: number;

  public seedTokenAddress: Address;
  public seedTokenInfo: ITokenInfo;
  public seedTokenContract: any;
  /**
   * number of tokens in this seed contract
   */
  public seedTokenCurrentBalance: BigNumber;

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
    return this.dateService.getDurationBetween(this._now, this.startTime).asMilliseconds();
  }

  @computedFrom("_now")
  public get endsInMilliseconds(): number {
    return this.dateService.getDurationBetween(this.endTime, this._now).asMilliseconds();
  }

  /**
   * effectively, can the user contribute
   */
  @computedFrom("_now")
  public get isActive(): boolean {
    return !this.maximumReached && ((this.startTime >= this._now) && (this._now < this.endTime));
  }

  /**
   * is it no longer possible to contribute
   */
  @computedFrom("_now")
  public get hasEnded(): boolean {
    return this.maximumReached || (this._now >= this.endTime);
  }

  @computedFrom("_now")
  public get hasNotStarted(): boolean {
    return (this._now < this.startTime);
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

  public create(config: ISeedConfiguration): Seed {
    this.initializedPromise = Utils.waitUntilTrue(() => !this.initializing, 9999999999);
    return Object.assign(this, config);
  }

  /**
   * note this is called when the contracts change
   * @param config
   * @returns
   */
  public async initialize(): Promise<Seed> {

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
      this.maximumReached = this.amountRaised.gte(this.cap);
      this.valuation = this.numberService.fromString(fromWei(await this.seedTokenContract.totalSupply()))
              * (this.seedTokenInfo.price ?? 0);
      this.seedTokenCurrentBalance = await this.seedTokenContract.balanceOf(this.address);
      await this.hydrateUser();

      this.initializing = false;
    }
    catch (error) {
      this.consoleLogService.handleFailure(
        new EventConfigFailure(`Seed: Error hydrating seed data ${error?.message}`));
      this.initializing = false;
    }
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

  public fundingTokenAllowance(): Promise<BigNumber> {
    return this.fundingTokenContract.allowance(this.ethereumService.defaultAccountAddress, this.address);
  }

  public unlockFundingTokens(amount: BigNumber): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.fundingTokenContract.approve(this.address, amount));
  }
}
