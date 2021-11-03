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
import { Address, EthereumService, fromWei, Networks, Hash } from "services/EthereumService";
import { IpfsService } from "services/IpfsService";
import { ILaunch, LaunchType } from "services/launchTypes";
import { NumberService } from "services/NumberService";
import { ITokenInfo, TokenService } from "services/TokenService";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";
import { Utils } from "services/utils";
import { Lbp } from "entities/Lbp";
import { jsonToGraphQLQuery } from "json-to-graphql-query";
import axios from "axios";

export interface ILbpManagerConfiguration {
  address: Address;
  admin: Address;
  metadata: Address;
}

interface ISwapRecord {
  timestamp: number,
  poolLiquidity: string,
  tokenIn: string,
  tokenAmountIn: string,
  tokenOut: string,
  tokenAmountOut: string,
}

interface IHistoricalMarketCapRecord { time: string, value?: number }

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
  public startingFundingTokenAmount: BigNumber;
  public startingProjectTokenAmount: BigNumber;
  public projectTokenBalance: BigNumber;
  public fundingTokenBalance: BigNumber;

  private projectTokenIndex: any;
  private fundingTokenIndex: number;
  // private userFundingTokenBalance: BigNumber;
  public poolTokenBalance: BigNumber;

  private historicalMarketCap = new Array<IHistoricalMarketCapRecord>();

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
      this.poolFunded = await this.contract.poolFunded();

      this.projectTokenIndex = await this.contract.projectTokenIndex();
      this.fundingTokenIndex = this.projectTokenIndex ? 0 : 1;

      if (this.poolFunded) {
        await this.hydrateLbp();
      }

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

      await this.hydrateHistoricalMarketCap();
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
    /**
     * TODO: use the LBPManager `getSwapEnabled` if it every becomes available
     */
    return this.isPaused = !((await this.lbp?.getSwapEnabled()) ?? true);
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
      this.startingProjectTokenAmount = await this.contract.amounts(this.projectTokenIndex);
      this.startingFundingTokenAmount = await this.contract.amounts(this.fundingTokenIndex);
      this.projectTokenBalance = this.lbp.vault.projectTokenBalance;
      this.fundingTokenBalance = this.lbp.vault.fundingTokenBalance;
      this.poolTokenBalance = await this.lbp.balanceOfPoolTokens(this.address);
      this.fundingTokensPerProjectToken = this.priceService.getProjectPriceRatio(
        this.numberService.fromString(fromWei(this.projectTokenBalance, this.projectTokenInfo.decimals)),
        this.numberService.fromString(fromWei(this.fundingTokenBalance, this.fundingTokenInfo.decimals)),
        this.lbp.projectTokenWeight,
      );
      this.projectTokensPerFundingToken = 1.0 / this.fundingTokensPerProjectToken;
      // USD price of a project token
      this.projectTokenInfo.price = this.fundingTokensPerProjectToken * this.fundingTokenInfo.price;
    }
  }

  private async hydrateLbp(): Promise<Lbp> {
    return this.lbp = await this.createLbp(await this.contract.lbp());
  }

  // public fundingTokenAllowance(): Promise<BigNumber> {
  //   return this.fundingTokenContract.allowance(this.ethereumService.defaultAccountAddress, this.address);
  // }

  public unlockFundingTokens(amount: BigNumber): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.fundingTokenContract.approve(this.lbp.vault.address, amount));
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
          this.hydatePaused();
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

  public swap() {
    // return this.transactionsService.send(
    //   () => this.lbp.swap())
    //   .then(async receipt => {
    //     if (receipt) {
    //       this.hydrate();
    //       return receipt;
    //     }
    //   });
  }

  private getBalancerSubgraphUrl() {
    return `https://api.thegraph.com/subgraphs/name/balancer-labs/balancer${this.ethereumService.targetedNetwork === Networks.Rinkeby ? "-rinkeby-v2" : "-v2"}`;
  }

  /* Is it needed? */
  private async fetchBalancerSubgraphData(): Promise<void> {
    // const uri = this.getBalancerSubgraphUrl();
    // const query = {
    //   pool: {
    //     swapFee: true,
    //     totalSwapFee: true,
    //     totalSwapVolume: true,
    //     liquidity: true,
    //     // holdersCount: true, // always returns 0
    //     __args: {
    //       id: this.lbp.address.toLowerCase(),
    //     },
    //   },
    // };

    // return axios.post(uri,
    //   JSON.stringify({ query: jsonToGraphQLQuery({ query }) }),
    //   {
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json",
    //     },
    //   })
    //   .then(async (response) => {
    //     const pool = response.data?.data?.pool;
    //     if (pool) {
    //       this.accruedFees = pool.totalSwapFee;
    //       this.accruedVolume = pool.totalSwapVolume;
    //       const swapfee = this.numberService.fromString(pool.swapFee);
    //       this.swapfee = toWei(swapfee);
    //       this.swapfeePercentage = swapfee * 100;
    //       this.marketCap = this.numberService.fromString(pool.liquidity);
    //       // this.membersCount = this.numberService.fromString(pool.holdersCount);
    //     }
    //   })
    //   .catch((error) => {
    //     this.consoleLogService.handleFailure(
    //       new EventConfigFailure(`Pool: Error fetching balancer subgraph info: ${error?.response?.data?.error?.message ?? error?.message}`));
    //     // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token info"}`);
    //     // TODO:  restore the exception?
    //     this.accruedFees = undefined;
    //   });
  }

  /* is it needed */
  public async hydrateMembers(): Promise<void> {
    // const members = (await this.tokenService.getHolders(this.poolToken.address))
    //   .map((holder: ITokenHolder) => {
    //     return holder.address;
    //   });
    // this.membersCount = members.length;
  }

  public async getMarketCapHistory(maxDays?: number): Promise<Array<IHistoricalMarketCapRecord>> {
    if (!this.lbp || !this.lbp.poolId) {
      console.log("No Pool ID");

      return [];
    }

    let startingDate: Date;

    if (maxDays) {
      startingDate = this.dateService.today;
      startingDate.setDate(startingDate.getDate() - maxDays);
    } else {
      startingDate = this.dateService.midnightOf(this.startTime);
    }
    const startingSeconds = startingDate.valueOf() / 1000;
    const hourSeconds = 60 * 60;
    const tomorrow = this.dateService.tomorrow; // midnight of today
    const tomorrowSeconds = tomorrow.valueOf() / 1000;
    /**
     * subgraph will return a maximum of 1000 records at a time.  so for a very active pool,
     * in a single query you can potentially obtain data for only a small slice of calendar time.
     *
     * So we fetch going backwards from today, 1000 at a time, until we've got all the records.
     */
    let swaps = new Array<ISwapRecord>();
    let fetched: Array<ISwapRecord>;
    do {
      /**
       * fetchSwaps returns swaps in descending time order, so the last one will be
       * the earliest one.
       */
      const endDateSeconds = swaps.length ? swaps[swaps.length-1].timestamp : tomorrowSeconds;
      fetched = await this.fetchSwaps(endDateSeconds, startingSeconds);
      swaps = swaps.concat(fetched);
    } while (fetched.length === 1000);

    const returnArray = new Array<IHistoricalMarketCapRecord>();

    if (swaps.length) {
      let previousDay;

      swaps.reverse(); // to ascending
      /**
       * enumerate every day
       */
      for (let timestamp = startingSeconds; timestamp < tomorrowSeconds; timestamp += hourSeconds) {

        const dateString = new Date(timestamp * 1000).toISOString();
        const todaysSwaps = new Array<ISwapRecord>();
        const nextDay = timestamp + hourSeconds;

        if (swaps.length) {
        // eslint-disable-next-line no-constant-condition
          while (true) {
            const swap = swaps[0];
            if (swap.timestamp >= nextDay) {
              break;
            }
            else if (swap.timestamp >= timestamp) {
              todaysSwaps.push(swap);
              swaps.shift();
              if (!swaps.length) {
                break;
              }
            } // swap.timestamp < timestamp
          }
        }

        if (todaysSwaps?.length) {
          // average
          // const liquidityThisDay = todaysSwaps.reduce((accumulator, currentValue) =>
          //   accumulator + this.numberService.fromString(currentValue.poolLiquidity), 0) / todaysSwaps.length;

          // max
          // const liquidityThisDay = todaysSwaps.reduce((accumulator, currentValue) =>
          //   accumulator = Math.max(accumulator, this.numberService.fromString(currentValue.poolLiquidity)), 0);

          // closing
          const liquidityThisDay = this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountIn) / this.numberService.fromString(todaysSwaps[todaysSwaps.length-1].tokenAmountOut) * 1; //USD Price

          returnArray.push({
            time: dateString,
            value: liquidityThisDay,
          });
          previousDay = liquidityThisDay;
        } else if (previousDay) {
          /**
           * keep the previous value
           */
          returnArray.push({
            time: dateString,
            value: previousDay,
          });
        } else {
          returnArray.push({
            time: dateString,
          });
        }
      }
    }

    console.log("fetched", {fetched: JSON.stringify(fetched), swapsStr: JSON.stringify(swaps), returnArray});

    return JSON.parse(JSON.stringify(returnArray));
  }

  private fetchSwaps(endDateSeconds: number, startDateSeconds: number): Promise<Array<ISwapRecord>> {
    const uri = this.getBalancerSubgraphUrl();
    const query = {
      swaps: {
        __args: {
          first: 1000,
          orderBy: "timestamp",
          orderDirection: "desc",
          where: {
            poolId: this.lbp.poolId.toLowerCase(),
            timestamp_gte: startDateSeconds,
            timestamp_lte: endDateSeconds,
          },
        },
        timestamp: true,
        tokenAmountIn: true,
        tokenAmountOut: true,
      },
    };

    return axios.post(uri,
      JSON.stringify({ query: jsonToGraphQLQuery({ query }) }),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        if (response.data.errors?.length) {
          throw new Error(response.data.errors[0]);
        }
        return response.data?.data.swaps;
      })
      .catch((error) => {
        // this.consoleLogService.handleFailure(
        //   new EventConfigFailure(`Pool: Error fetching market cap history: ${error?.response?.data?.error?.message ?? error?.message}`));
        console.log({
          fetchSwapsError: error.message,
          address: this.address,
          id: this.lbp.poolId,
        });

        // throw new Error(`${error.response?.data?.error.message ?? "Error fetching token info"}`);
        // TODO:  restore the exception?
        return [];
      });
  }

  private async hydrateHistoricalMarketCap(): Promise<void> {
    this.historicalMarketCap = await this.getMarketCapHistory(30);
    console.log("hist", this.historicalMarketCap);

  }

}

