import { AureliaHelperService } from "services/AureliaHelperService";
import { EthereumService, Networks, toWei } from "services/EthereumService";
import TransactionsService from "services/TransactionsService";
import { SortService } from "services/SortService";
import { ILbpConfig } from "newLaunch/lbp/lbpConfig";
import { IpfsService } from "./IpfsService";
import { Hash, Address } from "./EthereumService";
import { ConsoleLogService } from "./ConsoleLogService";
import { Container } from "aurelia-dependency-injection";
import { ContractNames, ContractsService, IStandardEvent } from "./ContractsService";
import { autoinject, computedFrom } from "aurelia-framework";
import { Lbp } from "entities/Lbp";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { api } from "services/GnosisService";

export interface ILbpCreatedEventArgs {
  newLbp: Address;
  beneficiary: Address;
}

// interface IFeaturedLbpsConfig {
//   [network: string]: { lbps: Array<Address> } ;
// }

@autoinject
export class LbpService {

  public lbps: Map<Address, Lbp>;
  public static lbpFee = 0.0; //If the value is ever > 0, then should be a fraction like 0.1 to represent 1%

  @computedFrom("lbps.size")
  public get lbpsArray(): Array<Lbp> {
    return this.lbps ? Array.from(this.lbps.values()) : [];
  }
  public initializing = true;
  private initializedPromise: Promise<void>;
  private lbpFactory: any;
  // private featuredLbpsJson: IFeaturedLbpsConfig;
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
    // if (!this.featuredLbpsJson) {
    //   // eslint-disable-next-line require-atomic-updates
    //   if (process.env.NODE_ENV === "development") {
    //     this.featuredLbpsJson = require("../configurations/featuredLbps.json");
    //   } else {
    //     axios.get("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/src/configurations/featuredLbps.json")
    //       .then((response) => this.featuredLbpsJson = response.data);
    //   }
    // }

    /**
     * don't need to reload the lbpfactory on account change because we never send txts to it.
     */
    this.lbpFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    /**
     * LBPs will take care of themselves on account changes
     */
    return this.getLbps();
  }

  // async hydrateStartingBlock(): Promise<void> {
  //   const filter = this.lbpFactory.filters.LbpCreated(undefined, this.address);
  //   const txEvents: Array<IStandardEvent<unknown>> = await this.lbpFactory.queryFilter(filter);
  //   this.startingBlockNumber = txEvents[0].blockNumber;
  //   // const block = await this.ethereumService.getBlock(this.startingBlockNumber);
  //   // this.startingDateTime = block.blockDate;
  // }

  private async getLbps(): Promise<void> {
    return this.initializedPromise = new Promise(
      (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): void => {
        if (!this.lbps?.size) {
          try {
            const lbpsMap = new Map<Address, Lbp>();
            const filter = this.lbpFactory.filters.LbpCreated();
            this.lbpFactory.queryFilter(filter, this.startingBlockNumber)
              .then(async (txEvents: Array<IStandardEvent<ILbpCreatedEventArgs>>) => {
                for (const event of txEvents) {
                  const lbp = this.createLbpFromConfig(event);
                  lbpsMap.set(lbp.address, lbp);
                  /**
                   * remove the LBP if it is corrupt
                   */
                  this.aureliaHelperService.createPropertyWatch(lbp, "corrupt", (newValue: boolean) => {
                    if (newValue) { // pretty much the only case
                      this.lbps.delete(lbp.address);
                    }
                  });
                  this.consoleLogService.logMessage(`loaded LBP: ${lbp.address}`, "info");
                  lbp.initialize(); // set this off asyncronously.
                }
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

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  public async ensureAllLbpsInitialized(): Promise<void> {
    await this.ensureInitialized();
    for (const lbp of this.lbpsArray) {
      await lbp.ensureInitialized();
    }
  }

  private _featuredLbps: Array<Lbp>;

  public async getFeaturedLbps(): Promise<Array<Lbp>> {

    if (this._featuredLbps) {
      return this._featuredLbps;
    }
    else {
      await this.ensureAllLbpsInitialized();
      // const network = this.featuredLbpsJson[this.ethereumService.targetedNetwork];
      /**
       * take the first three LBPs in order of when they start(ed), if they either haven't
       * started or are live.
       */
      // return network ? this._featuredLbps = network.lbps
      return this._featuredLbps = this.lbpsArray
        .filter((lbp: Lbp) => { return !lbp.uninitialized && !lbp.corrupt && (lbp.hasNotStarted || lbp.contributingIsOpen); })
        .sort((a: Lbp, b: Lbp) => SortService.evaluateDateTimeAsDate(a.startTime, b.startTime))
        .slice(0, 3);
    }
  }

  public async deployLbp(config: ILbpConfig): Promise<Hash> {

    const lbpConfigString = JSON.stringify(config);
    // this.consoleLogService.logMessage(`lbp registration json: ${lbpConfigString}`, "debug");

    const metaDataHash = await this.ipfsService.saveString(lbpConfigString, `${config.general.projectName}`);

    this.consoleLogService.logMessage(`lbp registration hash: ${metaDataHash}`, "info");

    const safeAddress = await ContractsService.getContractAddress(ContractNames.SAFE);
    const lbpFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    const signer = await this.contractsService.getContractFor(ContractNames.SIGNER);
    const gnosis = api(safeAddress, this.ethereumService.targetedNetwork);

    const transaction = {
      to: lbpFactory.address,
      value: 0,
      operation: 0,
    } as any;

    const lbpArguments = [
      safeAddress,
      [config.tokenDetails.projectTokenAddress, config.lbpDetails.fundingTokenAddress],
      config.lbpDetails.amountFundingToken,
      // convert from ISO string to Unix epoch seconds
      Date.parse(config.lbpDetails.startDate) / 1000,
      // convert from ISO string to Unix epoch seconds
      Date.parse(config.lbpDetails.endDate) / 1000,
      toWei(LbpService.lbpFee),
      this.asciiToHex(metaDataHash),
    ];

    transaction.data = (await lbpFactory.populateTransaction.deployLbp(...lbpArguments)).data;

    // console.log("estimating transaction:");
    // console.dir(transaction);

    const estimate = (await gnosis.getEstimate(transaction)).data;

    Object.assign(transaction, {
      safeTxGas: estimate.safeTxGas,
      nonce: await gnosis.getCurrentNonce(),
      baseGas: 0,
      gasPrice: 0,
      gasToken: "0x0000000000000000000000000000000000000000",
      refundReceiver: "0x0000000000000000000000000000000000000000",
      safe: safeAddress,
    });

    const { hash, signature } = await signer.callStatic.generateSignature(
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      transaction.safeTxGas,
      transaction.baseGas,
      transaction.gasPrice,
      transaction.gasToken,
      transaction.refundReceiver,
      transaction.nonce,
    );

    // eslint-disable-next-line require-atomic-updates
    transaction.contractTransactionHash = hash;
    // eslint-disable-next-line require-atomic-updates
    transaction.signature = signature;

    // console.log("generating signature for transaction:");
    // console.dir(transaction);

    const result = await this.transactionsService.send(() => signer.generateSignature(
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      transaction.safeTxGas,
      transaction.baseGas,
      transaction.gasPrice,
      transaction.gasToken,
      transaction.refundReceiver,
      transaction.nonce,
    ));

    if (!result) {
      return null;
    }

    // eslint-disable-next-line require-atomic-updates
    transaction.sender = signer.address;

    this.consoleLogService.logMessage(`sending to safe txHash: ${ hash }`, "info");

    const response = await gnosis.sendTransaction(transaction);

    if (response.status !== 201) {
      throw Error(`An error occurred submitting the transaction: ${response.statusText}`);
    }

    return metaDataHash;
  }

  private asciiToHex(str = ""): string {
    const res = [];
    const { length: len } = str;
    for (let n = 0, l = len; n < l; n++) {
      const hex = Number(str.charCodeAt(n)).toString(16);
      res.push(hex);
    }
    return `0x${res.join("")}`;
  }
}
