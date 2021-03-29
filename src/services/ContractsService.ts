import { Contract, ethers, Signer } from "ethers";
import { Address, EthereumService, Hash, IBlockInfoNative, IChainEventInfo } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";

const ContractAddresses = require("../contracts/contractAddresses.json") as INetworkContractAddresses;
const ConfigurableRightsPool = require("../contracts/ConfigurableRightsPool.json");
const CRPFactory = require("../contracts/CRPFactory.json");
const WETHABI = require("../contracts/WETH.json");
const BPOOL = require("../contracts/BPool.json");
const STAKINGREWARDS = require("../contracts/StakingRewards.json");
const ERC20ABI = require("../contracts/ERC20.json");

export enum ContractNames {
  ConfigurableRightsPool = "ConfigurableRightsPool"
  , CRPFactory = "CRPFactory"
  , BPOOL = "BPool"
  , WETH = "WETH"
  , PRIMETOKEN = "PrimeToken"
  , STAKINGREWARDS = "StakingRewards"
  //  , PrimeDAO = "Avatar"
  , IERC20 = "IERC20"
  ,
}

export interface IStandardEvent<TArgs> {
  args: TArgs;
  transactionHash: Hash;
  blockNumber: number;
  getBlock(): Promise<IBlockInfoNative>;
}

interface INetworkContractAddresses {
  [network: string]: Map<ContractNames, string>;
}

@autoinject
export class ContractsService {

  private static ABIs = new Map<ContractNames, any>(
    [
      [ContractNames.ConfigurableRightsPool, ConfigurableRightsPool.abi]
      , [ContractNames.CRPFactory, CRPFactory.abi]
      , [ContractNames.BPOOL, BPOOL.abi]
      , [ContractNames.STAKINGREWARDS, STAKINGREWARDS.abi]
      , [ContractNames.WETH, WETHABI.abi]
      , [ContractNames.PRIMETOKEN, ERC20ABI.abi]
      , [ContractNames.IERC20, ERC20ABI.abi]
      ,
    ],
  );

  private static Contracts = new Map<ContractNames, Contract>([
    [ContractNames.ConfigurableRightsPool, null]
    , [ContractNames.CRPFactory, null]
    , [ContractNames.BPOOL, null]
    , [ContractNames.STAKINGREWARDS, null]
    , [ContractNames.WETH, null]
    , [ContractNames.PRIMETOKEN, null]
    ,
  ]);

  private initializingContracts: Promise<void>;
  private initializingContractsResolver: () => void;
  private networkInfo: IChainEventInfo;
  private accountAddress: Address;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService) {

    this.eventAggregator.subscribe("Network.Changed.Account", (account: Address): void => {
      if (account !== this.accountAddress) {
        this.accountAddress = account;
        this.initializeContracts();
      }
    });

    const networkChange = (info) => {
      if ((this.networkInfo?.chainId !== info?.chainId) ||
        (this.networkInfo?.chainName !== info?.chainName) ||
        (this.networkInfo?.provider !== info?.provider)) {
        this.networkInfo = info;
        this.initializeContracts();
      }
    };

    this.eventAggregator.subscribe("Network.Changed.Disconnect", (): void => {
      networkChange(null);
    });

    this.eventAggregator.subscribe("Network.Changed.Connected", (info: IChainEventInfo): void => {
      networkChange(info);
    });

    this.eventAggregator.subscribe("Network.Changed.Id", (info: IChainEventInfo): void => {
      networkChange(info);
    });

    this.initializeContracts();
  }

  private setInitializingContracts(): void {
    if (!this.initializingContractsResolver) {
    /**
     * jump through this hook because the order of receipt of `EthereumService.onConnect`
     * is indeterminant, but we have to make sure `ContractsService.initializeContracts`
     * has completed before someone tries to use `this.Contracts` (see `getContractFor`).
     */
      this.initializingContracts = new Promise<void>((resolve: () => void) => {
        this.initializingContractsResolver = resolve;
      });
    }
  }

  private resolveInitializingContracts(): void {
    this.initializingContractsResolver();
    this.initializingContractsResolver = null;
  }

  private async assertContracts(): Promise<void> {
    return this.initializingContracts;
  }

  private createProvider() {
    let signerOrProvider;
    if (this.accountAddress) {
      signerOrProvider = Signer.isSigner(this.accountAddress) ? this.accountAddress : this.networkInfo.provider.getSigner(this.accountAddress);
    } else {
      signerOrProvider = this.ethereumService.readOnlyProvider;
    }
    return signerOrProvider;
  }

  private initializeContracts(): void {
    if (!ContractAddresses || !ContractAddresses[this.ethereumService.targetedNetwork]) {
      throw new Error("initializeContracts: ContractAddresses not set");
    }

    /**
     * to assert that contracts are not available during the course of this method
     */
    if (!this.initializingContractsResolver) {
      this.setInitializingContracts();
    }

    const reuseContracts = // at least one random contract already exists
      ContractsService.Contracts.get(ContractNames.ConfigurableRightsPool);

    const signerOrProvider = this.createProvider();

    ContractsService.Contracts.forEach((_contract, contractName) => {
      let contract;

      if (reuseContracts) {
        contract = ContractsService.Contracts.get(contractName).connect(signerOrProvider);
      } else {
        contract = new ethers.Contract(
          ContractAddresses[this.ethereumService.targetedNetwork][contractName],
          this.getContractAbi(contractName),
          signerOrProvider);
      }
      ContractsService.Contracts.set(contractName, contract);
    });

    this.eventAggregator.publish("Contracts.Changed");

    this.resolveInitializingContracts();
  }

  public async getContractFor(contractName: ContractNames): Promise<Contract & any> {
    await this.assertContracts();
    return ContractsService.Contracts.get(contractName);
  }

  public getContractAbi(contractName: ContractNames): Address {
    return ContractsService.ABIs.get(contractName);
  }

  public getContractAddress(contractName: ContractNames): Address {
    return ContractAddresses[this.ethereumService.targetedNetwork][contractName];
  }

  public getContractAtAddress(contractName: ContractNames, address: Address): Contract & any {
    return new ethers.Contract(
      address,
      this.getContractAbi(contractName),
      this.createProvider());
  }
}
