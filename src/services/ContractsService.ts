import { BigNumber, Contract, ethers, Signer } from "ethers";
import { Address, EthereumService, Hash, IBlockInfoNative, IChainEventInfo, isCeloNetworkLike, isLocalhostNetwork, isNetwork, Networks } from "services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { ContractsDeploymentProvider } from "services/ContractsDeploymentProvider";
import {
  BaseProvider,
  JsonRpcProvider,
} from "@ethersproject/providers";
import { EventConfigException } from "./GeneralEvents";

export enum ContractNames {
  LBPMANAGERFACTORY = "LBPManagerFactory",
  LBPMANAGER = "LBPManager"
  , LBP = "LiquidityBootstrappingPool"
  , VAULT = "Vault"
  , SEEDFACTORY = "SeedFactory"
  , SeedFactoryNoAccessControl = "SeedFactoryNoAccessControl" // Safe-free flow https://app.shortcut.com/curvelabs/story/1540/remove-celo-gnosis-flow-from-fe-temporary
  , SEED = "Seed"
  // , WETH = "WETH"
  , PRIME = "Prime"
  , DAI = "DAI"
  , IERC20 = "IERC20"
  , ERC20 = "ERC20"
  , SAFE = "Safe"
  , SIGNER = "SignerV2"
}

export interface IStandardEvent<TArgs> {
  args: TArgs;
  transactionHash: Hash;
  blockNumber: number;
  getBlock(): Promise<IBlockInfoNative>;
}

@autoinject
export class ContractsService {

  private static Contracts = new Map<ContractNames, Contract>([
    [ContractNames.LBPMANAGERFACTORY, null]
    , [ContractNames.LBPMANAGER, null]
    // , [ContractNames.VAULT, null]
    , [ContractNames.SEEDFACTORY, null]
    , [ContractNames.SEED, null]
    , [ContractNames.SIGNER, null]
    , // not on kovan we delete some of these below
  ]);

  private initializingContracts: Promise<void>;
  private initializingContractsResolver: () => void;
  private networkInfo: IChainEventInfo;
  private accountAddress: Address;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService) {

    /**
     * gnosis safe isn't on kovan, but we need kovan for testing balancer
     */
    if (
      EthereumService.targetedNetwork === Networks.Kovan ||
      isLocalhostNetwork()
    ) {
      ContractsService.Contracts.delete(ContractNames.LBPMANAGERFACTORY);
      ContractsService.Contracts.delete(ContractNames.LBPMANAGER);
      ContractsService.Contracts.delete(ContractNames.SIGNER);
    }

    if (isNetwork(Networks.Celo)) {
      ContractsService.Contracts.delete(ContractNames.SEEDFACTORY); // First safe-free version does not have regular `SeedFactory` contract deployed yet
      ContractsService.Contracts.delete(ContractNames.SIGNER); // First safe-free version does not have regular `SeedFactory` contract deployed yet
    }

    if (isCeloNetworkLike() || isLocalhostNetwork()) {
      // https://app.shortcut.com/curvelabs/story/1540/remove-celo-gnosis-flow-from-fe-temporary
      ContractsService.Contracts.set(ContractNames.SeedFactoryNoAccessControl, null);

      ContractsService.Contracts.delete(ContractNames.LBPMANAGERFACTORY);
      ContractsService.Contracts.delete(ContractNames.LBPMANAGER);
    }

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

  public createProvider(): any {
    let signerOrProvider: BaseProvider | JsonRpcProvider | ethers.Signer;
    if (this.accountAddress && this.networkInfo?.provider) {
      signerOrProvider = Signer.isSigner(this.accountAddress) ? this.accountAddress : this.networkInfo.provider.getSigner(this.accountAddress);
    } else {
      if (isLocalhostNetwork()) {
        const jsonSigner: JsonRpcProvider = this.ethereumService.readOnlyProvider as JsonRpcProvider;
        signerOrProvider = jsonSigner.getSigner(this.ethereumService.defaultAccountAddress ?? undefined);
      } else {
        signerOrProvider = this.ethereumService.readOnlyProvider;
      }
    }
    return signerOrProvider;
  }

  private initializeContracts(): void {
    /**
     * to assert that contracts are not available during the course of this method
     */
    if (!this.initializingContractsResolver) {
      this.setInitializingContracts();
    }

    const reuseContracts = // at least one arbitrary contract already exists
      ContractsService.Contracts.get(ContractNames.SEEDFACTORY);

    const signerOrProvider = this.createProvider();

    ContractsService.Contracts.forEach((_contract, contractName) => {
      let contract;

      if (reuseContracts) {
        contract = ContractsService.Contracts.get(contractName).connect(signerOrProvider);
      } else {
        try {
          contract = new ethers.Contract(
            ContractsService.getContractAddress(contractName),
            ContractsService.getContractAbi(contractName),
            signerOrProvider);
        } catch (error) {
          throw new Error(`No Abi for Contract "${contractName}" found.`);
        }
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

  public static getContractAbi(contractName: ContractNames): Array<any> {
    return ContractsDeploymentProvider.getContractAbi(contractName);
  }

  public static getContractAddress(contractName: ContractNames): Address {
    return ContractsDeploymentProvider.getContractAddress(contractName);
  }

  public getContractAtAddress(contractName: ContractNames, address: Address): Contract & any {
    /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: ContractsService.ts ~ line 199 ~ contractName", contractName);
    return new ethers.Contract(
      address,
      ContractsService.getContractAbi(contractName),
      this.createProvider());
  }

  // org.zeppelinos.proxy.implementation
  private static storagePositionZep = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

  // eip1967.proxy.implementation
  private static storagePosition1967 = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";


  /**
   * Attempts to obtain the addresss of a proxy contract implementation.
   * Uses a heuristic described here:
   *     https://ethereum.stackexchange.com/questions/103143/how-do-i-get-the-implementation-contract-address-from-the-proxy-contract-address
   *
   * More info here:
   *     https://medium.com/etherscan-blog/and-finally-proxy-contract-support-on-etherscan-693e3da0714b
   *
   * @param proxyContract
   * @returns null if not found
   */
  public async getProxyImplementation(proxyContract: Address): Promise<Address> {

    let result = await this.ethereumService.readOnlyProvider.getStorageAt(proxyContract, ContractsService.storagePositionZep);
    if (BigNumber.from(result).isZero()) {
      result = await this.ethereumService.readOnlyProvider.getStorageAt(proxyContract, ContractsService.storagePosition1967);
    }

    const bnResult = BigNumber.from(result);

    return bnResult.isZero() ? null : bnResult.toHexString();
  }

  /**
   * fetch Events in small blocks to avoid "block range is too wide" error from the provider
   */
  public async filterEventsInBlocks<TEventArgs>(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    contract: any,
    filter: unknown,
    startingBlockNumber: number,
    handler: (event: Array<IStandardEvent<TEventArgs>>) => void): Promise<void> {

    const lastBlock = await this.ethereumService.getLastBlock();
    if (lastBlock === null) {
      this.eventAggregator.publish("handleException", new EventConfigException("Could not filter events", "No Blocks found"));
      return;
    }

    const lastEthBlockNumber = lastBlock.number;
    const blocksToFetch = lastEthBlockNumber - startingBlockNumber;
    let startingBlock = startingBlockNumber;

    /**
       * fetch in small blocks to avoid "block range is too wide" error from the provider
       */
    const blocksize = (EthereumService.targetedNetwork === Networks.Arbitrum) ? 100000 : blocksToFetch;
    let fetched = 0;

    do {
      const endBlock = startingBlock + blocksize + 1;
      await contract.queryFilter(filter, startingBlock, endBlock)
        .then((events: Array<IStandardEvent<TEventArgs>>): void => {
          if (events?.length) {
            handler(events);
          }
        });
      fetched += blocksize;
      startingBlock += blocksize;
    } while (fetched < blocksToFetch);

  }
}
