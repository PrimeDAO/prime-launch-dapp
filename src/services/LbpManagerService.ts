import { ILbpConfig } from "newLaunch/lbp/config";
import { LbpManager } from "entities/LbpManager";
import { autoinject, computedFrom } from "aurelia-framework";
import { Address, Hash, toWei } from "services/EthereumService";
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
import { Utils } from "services/utils";
import { api } from "services/GnosisService";

export interface ILBPManagerDeployedEventArgs {
  lbpManager: Address;
  admin: Address;
  metadata: string;
}

@autoinject
export class LbpManagerService {

  public lbpManagers: Map<Address, LbpManager>;
  public static lbpFee = 0.0; // If the value is ever > 0, then should be a fraction like 0.1 to represent 1%
  public static lbpSwapFee = .1; // If the value is ever > 0, then should be a fraction like 0.1 to represent 1%

  @computedFrom("lbps.size")
  public get lbpManagersArray(): Array<LbpManager> {
    return this.lbpManagers ? Array.from(this.lbpManagers.values()) : [];
  }

  public initializing = true;

  private lbpManagerFactory: any;
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
    this.container.registerTransient(LbpManager);

    this.eventAggregator.subscribe("LbpManager.InitializationFailed", async (lbpAddress: string) => {
      this.lbpManagers.delete(lbpAddress);
    });

    this.startingBlockNumber = (this.ethereumService.targetedNetwork === Networks.Mainnet) ?
      13372668 : 9423409;
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
    this.lbpManagerFactory = await this.contractsService.getContractFor(ContractNames.LBPMANAGERFACTORY);
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
    for (const lbp of this.lbpManagersArray) {
      await lbp.ensureInitialized();
    }
  }

  private async getLbps(): Promise<void> {
    return this.initializedPromise = new Promise(
      (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): void => {
        if (!this.lbpManagers?.size) {
          try {
            const lbpMgrsMap = new Map<Address, LbpManager>();
            const filter = this.lbpManagerFactory.filters.LBPManagerDeployed();
            this.lbpManagerFactory.queryFilter(filter, this.startingBlockNumber)
              .then(async (txEvents: Array<IStandardEvent<ILBPManagerDeployedEventArgs>>) => {
                for (const event of txEvents) {
                  const lbpMgr = this.createLbpManagerFromConfig(event);
                  lbpMgrsMap.set(lbpMgr.address, lbpMgr);
                  /**
                   * remove the seed if it is corrupt
                   */
                  this.aureliaHelperService.createPropertyWatch(lbpMgr, "corrupt", (newValue: boolean) => {
                    if (newValue) { // pretty much the only case
                      this.lbpManagers.delete(lbpMgr.address);
                    }
                  });
                  this.consoleLogService.logMessage(`loaded LBP: ${lbpMgr.address}`, "info");
                  lbpMgr.initialize(); // set this off asyncronously.
                }
                this.lbpManagers = lbpMgrsMap;
                this.initializing = false;
                resolve();
              });
          }
          catch (error) {
            this.lbpManagers = new Map();
            this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", error));
            this.initializing = false;
            reject();
          }
        }
      },
    );
  }

  private createLbpManagerFromConfig(config: IStandardEvent<ILBPManagerDeployedEventArgs>): LbpManager {
    const lbpMgr = this.container.get(LbpManager);
    return lbpMgr.create({ admin: config.args.admin, address: config.args.lbpManager, metadata: config.args.metadata });
    return null;
  }


  public async deployLpbManager(config: ILbpConfig): Promise<Hash> {

    const lbpConfigString = JSON.stringify(config);
    // this.consoleLogService.logMessage(`seed registration json: ${seedConfigString}`, "debug");

    const metaDataHash = await this.ipfsService.saveString(lbpConfigString, `${config.general.projectName}`);

    this.consoleLogService.logMessage(`lbpmanager registration hash: ${metaDataHash}`, "info");

    const safeAddress = await ContractsService.getContractAddress(ContractNames.SAFE);
    const lbpManagerFactory = await this.contractsService.getContractFor(ContractNames.LBPMANAGERFACTORY);
    const signer = await this.contractsService.getContractFor(ContractNames.SIGNER);
    const gnosis = api(safeAddress, this.ethereumService.targetedNetwork);

    const transaction = {
      to: lbpManagerFactory.address,
      value: 0,
      operation: 0,
    } as any;

    const lbpArguments = [
      config.launchDetails.adminAddress,
      safeAddress,
      config.tokenDetails.projectTokenInfo.name,
      config.tokenDetails.projectTokenInfo.symbol,
      [config.tokenDetails.projectTokenInfo.address, config.launchDetails.fundingTokenInfo.address],
      [config.launchDetails.amountProjectToken, config.launchDetails.amountFundingToken],
      [toWei(config.launchDetails.startWeight / 100), toWei((100 - config.launchDetails.startWeight) / 100)],
      [Date.parse(config.launchDetails.startDate) / 1000, Date.parse(config.launchDetails.endDate) / 1000],
      [toWei(config.launchDetails.endWeight / 100), toWei((100 - config.launchDetails.endWeight) / 100)],
      [toWei(LbpManagerService.lbpSwapFee), toWei(LbpManagerService.lbpFee)],
      Utils.asciiToHex(metaDataHash),
    ];

    transaction.data = (await lbpManagerFactory.populateTransaction.deployLBPManager(...lbpArguments)).data;

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

    this.consoleLogService.logMessage(`sending to safe txHash: ${hash}`, "info");

    const response = await gnosis.sendTransaction(transaction);

    if (response.status !== 201) {
      throw Error(`An error occurred submitting the transaction: ${response.statusText}`);
    }

    return metaDataHash;
  }

}
