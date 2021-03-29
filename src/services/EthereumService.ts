/* eslint-disable no-console */
import { BigNumber, ethers, Signer } from "ethers";
import { BaseProvider, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { EventConfigFailure } from "services/GeneralEvents";
import { formatEther, parseEther } from "ethers/lib/utils";

interface IEIP1193 {
  on(eventName: "accountsChanged", handler: (accounts: Array<Address>) => void);
  on(eventName: "chainChanged", handler: (chainId: number) => void);
  on(eventName: "connect", handler: (info: { chainId: number }) => void);
  on(eventName: "disconnect", handler: (error: { code: number; message: string }) => void);
}

export type Address = string;
export type Hash = string;

export interface IBlockInfoNative {
  hash: Hash;
  /**
   * previous block
   */
  parentHash: Hash;
  /**
   *The height(number) of this
   */
  number: number;
  timestamp: number;
  /**
   * The maximum amount of gas that this block was permitted to use. This is a value that can be voted up or voted down by miners and is used to automatically adjust the bandwidth requirements of the network.
   */
  gasLimit: BigNumber;
  /**
   * The total amount of gas used by all transactions in this
   */
  gasUsed: BigNumber
  transactions: Array<Hash>;
}

export interface IBlockInfo extends IBlockInfoNative {
  blockDate: Date;
}

export type AllowedNetworks = "mainnet" | "kovan" | "rinkeby";

export enum Networks {
  Mainnet = "mainnet",
  Rinkeby = "rinkeby",
  Kovan = "kovan",
}

export interface IChainEventInfo {
  chainId: number;
  chainName: AllowedNetworks;
  provider: Web3Provider;
}

@autoinject
export class EthereumService {
  constructor(private eventAggregator: EventAggregator) { }

  private static ProviderEndpoints = {
    "mainnet": `https://${process.env.RIVET_ID}.eth.rpc.rivet.cloud/`,
    "rinkeby": `https://${process.env.RIVET_ID}.rinkeby.rpc.rivet.cloud/`,
    // "kovan": `https://${process.env.RIVET_ID}.kovan.rpc.rivet.cloud/`,
    "kovan": `https://kovan.infura.io/v3/${process.env.INFURA_ID}`,
  }
  private static providerOptions = {
    torus: {
      package: Torus, // required
      options: {
        network: "",
        // networkParams: {
        //   host: "https://localhost:8545", // optional
        //   chainId: 1337, // optional
        //   networkId: 1337, // optional
        // },
        // config: {
        //   buildEnv: "development", // optional
        // },
      },
    },
    // TODO: test with walletconnect
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        rpc: {
          1: EthereumService.ProviderEndpoints[Networks.Mainnet],
          // 4: EthereumService.ProviderEndpoints[Networks.Rinkeby],
          42: EthereumService.ProviderEndpoints[Networks.Kovan],
        },
      },
    },
  };

  public targetedNetwork: AllowedNetworks;
  /**
   * provided by ethers
   */
  public readOnlyProvider: BaseProvider;

  private blockSubscribed: boolean;

  private handleNewBlock = async (blockNumber: number): Promise<void> => {
    const block = await this.getBlock(blockNumber);
    this._lastBlockDate = block.blockDate;
    this.eventAggregator.publish("Network.NewBlock", block);
  }

  public initialize(network: AllowedNetworks): void {

    if (!network) {
      throw new Error("Ethereum.initialize: `network` must be specified");
    }

    this.targetedNetwork = network;

    EthereumService.providerOptions.torus.options.network = network;

    const readonlyEndPoint = EthereumService.ProviderEndpoints[this.targetedNetwork];
    if (!readonlyEndPoint) {
      throw new Error(`Please connect to either ${Networks.Mainnet} or ${Networks.Kovan}`);
    }

    // comment out to run DISCONNECTED
    this.readOnlyProvider = ethers.getDefaultProvider(EthereumService.ProviderEndpoints[this.targetedNetwork]);

    if (!this.blockSubscribed) {
      this.readOnlyProvider.on("block", (blockNumber: number) => this.handleNewBlock(blockNumber));
      this.blockSubscribed = true;
    }
  }

  private web3Modal: Web3Modal;
  /**
   * provided by Web3Modal
   */
  private web3ModalProvider: Web3Provider & IEIP1193;

  private chainNameById = new Map<number, AllowedNetworks>([
    [1, Networks.Mainnet],
    [4, Networks.Rinkeby],
    [42, Networks.Kovan],
  ]);

  private async getChainId(provider: Web3Provider): Promise<number> {
    return Number((await provider.send("net_version", [])));
  }

  private async getCurrentAccountFromProvider(provider: Web3Provider): Promise<Signer | string> {
    let account: Signer | string;
    if (Signer.isSigner(provider)) {
      account = provider;
    } else {
      const accounts = await provider.listAccounts();

      if (accounts) {
        account = accounts[0];
      } else {
        account = null;
      }
    }
    return account;
  }

  private fireAccountsChangedHandler(account: Address) {
    console.info(`account changed: ${account}`);
    this.eventAggregator.publish("Network.Changed.Account", account);
  }
  private fireChainChangedHandler(info: IChainEventInfo) {
    console.info(`chain changed: ${info.chainId}`);
    this.eventAggregator.publish("Network.Changed.Id", info);
  }
  private fireConnectHandler(info: IChainEventInfo) {
    console.info(`connected: ${info.chainName}`);
    this.eventAggregator.publish("Network.Changed.Connected", info);
  }
  private fireDisconnectHandler(error: { code: number; message: string }) {
    console.info(`disconnected: ${error?.code}: ${error?.message}`);
    this.eventAggregator.publish("Network.Changed.Disconnect", error);
  }

  /**
   * address, even if signer
   */
  private async getDefaultAccountAddress(): Promise<Address | undefined> {
    if (Signer.isSigner(this.defaultAccount)) {
      return await this.defaultAccount.getAddress();
    } else {
      return this.defaultAccount;
    }
  }

  /**
   * signer or address
   */
  private defaultAccount: Signer | Address;

  /**
   * provided by ethers given provider from Web3Modal
   */
  public walletProvider: Web3Provider;
  public defaultAccountAddress: Address;

  public async connect(network = Networks.Mainnet): Promise<void> {

    if (!this.web3Modal) {
      this.web3Modal = new Web3Modal({
        network, // optional
        // cacheProvider: true, // optional
        providerOptions: EthereumService.providerOptions, // required
        theme: "dark",
      });
      this.web3Modal?.clearCachedProvider(); // just in case
    }

    const web3ModalProvider = await this.web3Modal.connect();
    if (web3ModalProvider) {
      const walletProvider = new ethers.providers.Web3Provider(web3ModalProvider);
      (walletProvider as any).provider.autoRefreshOnNetworkChange = false; // mainly for metamask
      const chainId = await this.getChainId(walletProvider);
      const chainName = this.chainNameById.get(chainId);
      if (chainName !== this.targetedNetwork) {
        this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Please connect to ${this.targetedNetwork}`));
        return;
      }
      /**
       * we will keep the original readonly provider which should still be fine since
       * the targeted network cannot have changed.
       */
      this.walletProvider = walletProvider;
      this.web3ModalProvider = web3ModalProvider;
      this.defaultAccount = await this.getCurrentAccountFromProvider(this.walletProvider);
      this.defaultAccountAddress = await this.getDefaultAccountAddress();
      /**
       * because the events aren't fired on first connection
       */
      this.fireConnectHandler({ chainId, chainName, provider: this.walletProvider });
      this.fireAccountsChangedHandler(this.defaultAccountAddress);

      this.web3ModalProvider.on("accountsChanged", this.handleAccountsChanged);

      this.web3ModalProvider.on("chainChanged", this.handleChainChanged);

      this.web3ModalProvider.on("disconnect", this.handleDisconnect);
    }
  }

  private handleAccountsChanged = async (accounts: Array<Address>) => {
    this.defaultAccount = await this.getCurrentAccountFromProvider(this.walletProvider);
    this.defaultAccountAddress = await this.getDefaultAccountAddress();
    this.fireAccountsChangedHandler(accounts?.[0]);
  }

  private handleChainChanged = (chainId: number) => {
    const chainName = this.chainNameById.get(chainId);
    if (chainName !== this.targetedNetwork) {
      this.disconnect({ code: -1, message: "wrong network" });
      this.eventAggregator.publish("handleFailure", new EventConfigFailure(`Please connect to ${this.targetedNetwork}`));
      return;
    }
    else {
      this.fireChainChangedHandler({ chainId, chainName, provider: this.walletProvider });
    }
  }

  private handleDisconnect = (error: { code: number; message: string }) => {
    this.disconnect(error);
  }

  private async disconnect(error) {
    this.web3Modal?.clearCachedProvider(); // so web3Modal will let the user reconnect
    this.web3ModalProvider?.off("accountsChanged", this.handleAccountsChanged);
    this.web3ModalProvider?.off("chainChanged", this.handleChainChanged);
    this.web3ModalProvider?.off("disconnect", this.handleDisconnect);
    this.defaultAccount = undefined;
    this.defaultAccountAddress = undefined;
    this.fireAccountsChangedHandler(null);
    this.web3ModalProvider = undefined;
    this.walletProvider = undefined;
    this.fireDisconnectHandler(error);
  }

  private _lastBlockDate: Date;

  public get lastBlockDate(): Date {
    return this._lastBlockDate;
  }

  /**
   * so unit tests will be able to complete
   */
  public dispose(): void {
    this.readOnlyProvider.off("block", (blockNumber: number) => this.handleNewBlock(blockNumber));
  }

  public ensureConnected(): boolean {
    if (!this.defaultAccountAddress) {
      // TODO: make this await until we're either connected or not?
      this.connect();
      return false;
    }
    else {
      return true;
    }
  }

  public async getBlock(blockNumber: number): Promise<IBlockInfo> {
    const block = await this.readOnlyProvider.getBlock(blockNumber) as unknown as IBlockInfo;
    block.blockDate = new Date(block.timestamp * 1000);
    return block;
  }
}

export const toWei = (ethValue: BigNumber | string | number): BigNumber => {
  return parseEther(ethValue.toString());
};

export const fromWei = (weiValue: BigNumber | string): string => {
  return formatEther(weiValue.toString());
};

export const NULL_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
