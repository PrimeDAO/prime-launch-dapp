import { Container } from "aurelia-dependency-injection";
import { LbpProjectTokenPriceService } from "./../services/LbpProjectTokenPriceService";
import { BigNumber } from "@ethersproject/providers/node_modules/@ethersproject/bignumber";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { ILbpConfig } from "newLaunch/lbp/config";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { DateService } from "services/DateService";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService, fromWei, Hash } from "services/EthereumService";
import { IpfsService } from "services/IpfsService";
import { ILaunch, LaunchType } from "services/launchTypes";
import { NumberService } from "services/NumberService";
import { ITokenInfo, TokenService } from "services/TokenService";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";
import { Utils } from "services/utils";
import { Lbp } from "entities/Lbp";

export interface ILbpManagerConfiguration {
  address: Address;
  admin: Address;
  metadata: Address;
}

@autoinject
export class LbpManager implements ILaunch {
  public launchType = LaunchType.LBP;
  public contract: any;
  public address: Address;
  public lbpInitialized: boolean;
  public poolFunded: boolean;
  public beneficiary: Address;
  public startTime: Date;
  public endTime: Date;
  public admin: Address;

  /**
    * Is the lbp contract initialized and have enough project tokens to pay its obligations
    */
  public initializing = true;
  public metadata: ILbpConfig;
  public metadataHash: Hash;
  public corrupt = false;
  public userHydrated = false;

  public lbp: Lbp;
  public projectTokenAddress: Address;
  public projectTokenInfo: ITokenInfo;
  public projectTokenContract: any;
  public fundingTokenAddress: Address;
  public fundingTokenInfo: ITokenInfo;
  public fundingTokenContract: any;
  public isPaused: boolean;
  public fundingTokensPerProjectToken: number;
  public projectTokensPerFundingToken: number;

  private projectTokenIndex: any;
  private fundingTokenIndex: number;
  private projectTokenBalance: BigNumber;
  private fundingTokenBalance: BigNumber;
  // private userFundingTokenBalance: BigNumber;

  @computedFrom("_now")
  public get startsInMilliseconds(): number {
    return this.dateService.getDurationBetween(this.startTime, this._now).asMilliseconds();
  }

  @computedFrom("_now")
  public get endsInMilliseconds(): number {
    return this.dateService.getDurationBetween(this.endTime, this._now).asMilliseconds();
  }

  @computedFrom("_now")
  public get hasNotStarted(): boolean {
    return (this._now < this.startTime);
  }
  /**
   * we are between the start and end dates.
   * Doesn't mean you can do anything.
   */
  @computedFrom("_now")
  public get isLive(): boolean {
    return (this._now >= this.startTime) && (this._now < this.endTime);
  }
  /**
   * we are after the end date.
   * No implications about whether you can do anything.
   */
  @computedFrom("_now")
  public get isDead(): boolean {
    return (this._now >= this.endTime);
  }

  @computedFrom("uninitialized")
  get canGoToDashboard(): boolean {
    return !this.uninitialized;
  }

  @computedFrom("lbpInitialized", "poolFunded")
  get uninitialized(): boolean {
    return !this.lbpInitialized || !this.poolFunded;
  }

  private initializedPromise: Promise<void>;
  private subscriptions = new DisposableCollection();
  private _now = new Date();

  constructor(
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService,
    private eventAggregator: EventAggregator,
    private container: Container,
    private dateService: DateService,
    private tokenService: TokenService,
    private transactionsService: TransactionsService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
    private priceService: LbpProjectTokenPriceService,
    private numberService: NumberService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (state: { now: Date }) => {
      this._now = state.now;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.loadContracts().then(() => { this.hydrateUser(); });
    }));
  }

  public create(config: ILbpManagerConfiguration): LbpManager {
    this.initializedPromise = Utils.waitUntilTrue(() => !this.initializing, 9999999999);
    return Object.assign(this, config);
  }

  /**
   * note this is called when the contracts change
   * @param config
   * @returns
 */
  public async initialize(): Promise<void> {
    this.initializing = true;
    await this.loadContracts();
    /**
       * no, intentionally don't await
       */
    this.hydrate();
  }

  private disable():void {
    this.corrupt = true;
    this.subscriptions.dispose();
  }

  private createLbp(address: Address): Promise<Lbp> {
    if (address)
    {
      const lbp = this.container.get(Lbp);
      return lbp.initialize(
        address,
        this.projectTokenIndex,
        this.fundingTokenIndex);
    } else {
      return undefined;
    }
  }

  private async loadContracts(): Promise<void> {
    try {
      this.contract = await this.contractsService.getContractAtAddress(ContractNames.LBPMANAGER, this.address);
      if (this.projectTokenAddress) {
        this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
        this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);
      }
      if (this.lbp) {
        await this.lbp.loadContracts();
      }
    }
    catch (error) {
      this.disable();
      this.initializing = false;
      this.consoleLogService.logMessage(`LbpManager: Error initializing lbpmanager: ${error?.message ?? error}`, "error");
    }
  }

  private async hydrate(): Promise<void> {
    try {
      await this.hydrateMetadata();

      this.lbpInitialized = await this.contract.initialized();

      this.projectTokenIndex = await this.contract.projectTokenIndex();
      this.fundingTokenIndex = this.projectTokenIndex ? 0 : 1;

      if (this.lbpInitialized) {
        await this.hydrateLbp();
      }

      this.poolFunded = await this.contract.poolFunded();
      this.admin = await this.contract.admin();
      // const tokenStartWeightsArray = await this.contract.startWeights();
      // const tokenEndWeightsArray = await this.contract.endWeights();

      this.projectTokenAddress = (await this.contract.tokenList(this.projectTokenIndex));
      this.fundingTokenAddress = (await this.contract.tokenList(this.fundingTokenIndex));

      this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.fundingTokenAddress);

      this.projectTokenInfo = this.metadata.tokenDetails.projectTokenInfo;
      if (!this.projectTokenInfo || (this.projectTokenInfo.address !== this.projectTokenAddress)) {
        throw new Error("project token info is not found or does not match the LbpManager contract");
      }

      this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
      this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);

      this.hydrateTokensState();

      this.startTime = this.dateService.unixEpochToDate((await this.contract.startTimeEndTime(0)).toNumber());
      this.endTime = this.dateService.unixEpochToDate((await this.contract.startTimeEndTime(1)).toNumber());

      await this.hydatePaused();

      await this.hydrateUser();
    }
    catch (error) {
      this.disable();
      this.consoleLogService.logMessage(`LbpManager: Error initializing lpbManager: ${error?.message ?? error}`, "error");
    } finally {
      this.initializing = false;
    }
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  public async hydatePaused(): Promise<boolean> {
    this.isPaused = false; // TODO: await this.contract.paused();
    return this.isPaused;
  }

  private async hydrateUser(): Promise<void> {
    const account = this.ethereumService.defaultAccountAddress;

    this.userHydrated = false;

    if (account) {
      // this.userFundingTokenBalance = await this.fundingTokenContract.balanceOf(account);
      this.userHydrated = true;
    }
  }

  private async hydrateMetadata(): Promise<void> {
    const rawMetadata = await this.contract.metadata();
    if (rawMetadata && Number(rawMetadata)) {
      this.metadataHash = Utils.toAscii(rawMetadata.slice(2));
      this.consoleLogService.logMessage(`loaded LpbManager metadata: ${this.metadataHash}`, "info");
    } else {
      this.eventAggregator.publish("LbpManager.InitializationFailed", this.address);
      throw new Error(`LbpManager lacks metadata, is unusable: ${this.address}`);
    }

    if (this.metadataHash) {
      this.metadata = await this.ipfsService.getObjectFromHash(this.metadataHash);
      if (!this.metadata) {
        this.eventAggregator.publish("LbpManager.InitializationFailed", this.address);
        throw new Error(`LbpManager metadata is not found in IPFS, LbpManager is unusable: ${this.address}`);
      }
    }
  }

  private async hydrateTokensState(): Promise<void> {
    if (this.lbp) {
      this.projectTokenBalance = this.lbp.vault.projectTokenBalance;
      this.fundingTokenBalance = this.lbp.vault.fundingTokenBalance;
      this.fundingTokensPerProjectToken = this.priceService.getProjectPriceRatio(
        this.numberService.fromString(fromWei(this.projectTokenBalance, this.projectTokenInfo.decimals)),
        this.numberService.fromString(fromWei(this.fundingTokenBalance, this.fundingTokenInfo.decimals)),
        this.lbp.projectTokenWeight,
      );
      this.projectTokensPerFundingToken = 1.0 / this.fundingTokensPerProjectToken;
      // USD price of a project token
      this.projectTokenInfo.price = this.fundingTokensPerProjectToken * this.fundingTokenInfo.price;
    } else {
      this.projectTokensPerFundingToken = undefined;
    }
  }

  private async hydrateLbp(): Promise<Lbp> {
    return this.lbp = await this.createLbp(await this.contract.lbp());
  }

  public fund(): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.initializeLBP(this.admin))
      .then(async (receipt) => {
        if (receipt) {
          /**
           * now we can fetch an Lbp.  Need it to completely hydrate token state
           */
          await this.hydrateLbp();
          this.hydrateTokensState();
          this.hydrateUser();
          return receipt;
        }
      });
  }

  public async withdraw(receiver: Address): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.removeLiquidity(receiver))
      .then(async receipt => {
        if (receipt) {
          this.hydrateTokensState();
          this.hydrateUser();
          return receipt;
        }
      });
  }

  public async setSwapEnabled(state: boolean): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.setSwapEnabled(state))
      .then(async receipt => {
        if (receipt) {
          this.hydrate();
          return receipt;
        }
      });
  }

  public async getTokenFundingAmounts(): Promise<{funding: BigNumber, project: BigNumber}> {
    return {
      project: await this.contract.amounts(this.projectTokenIndex),
      funding: await this.contract.amounts(this.fundingTokenIndex),
    };
  }
}

