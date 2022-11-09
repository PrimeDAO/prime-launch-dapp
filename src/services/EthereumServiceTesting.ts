/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-console */
import { ethers } from "ethers";
import {
  BaseProvider,
  JsonRpcFetchFunc,
  Web3Provider,
} from "@ethersproject/providers";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { DisclaimerService } from "services/DisclaimerService";
import {
  Address,
  AllowedNetworks,
  EthereumService,
  Hash,
  IBlockInfo,
  Networks,
} from "./EthereumService";
import { E2E_ADDRESSES, E2E_ADDRESSES_PRIVATE_KEYS } from "./../../cypress/fixtures/walletFixtures";

@autoinject
export class EthereumServiceTesting {
  constructor(
    private eventAggregator: EventAggregator,
    private disclaimerService: DisclaimerService,
  ) {}

  public static ProviderEndpoints = {
    mainnet: `https://${process.env.RIVET_ID}.eth.rpc.rivet.cloud/`,
    rinkeby: `https://${process.env.RIVET_ID}.rinkeby.rpc.rivet.cloud/`,
    kovan: `https://kovan.infura.io/v3/${process.env.INFURA_ID}`,
  };

  public static targetedNetwork: AllowedNetworks;
  public static targetedChainId: number;

  /**
   * provided by ethers
   */
  public readOnlyProvider: BaseProvider;

  public initialize(network: AllowedNetworks): void {
    if (!network) {
      throw new Error("Ethereum.initialize: `network` must be specified");
    }

    EthereumService.targetedNetwork = network;
    EthereumService.targetedChainId = this.chainIdByName.get(network);

    // comment out to run DISCONNECTED
    this.readOnlyProvider = ethers.getDefaultProvider(
      EthereumService.ProviderEndpoints[EthereumService.targetedNetwork],
    );
    this.readOnlyProvider.pollingInterval = 15000;
  }

  private chainIdByName = new Map<AllowedNetworks, number>([
    [Networks.Mainnet, 1],
    [Networks.Goerli, 5],
    [Networks.Kovan, 42],
    [Networks.Celo, 42220],
    [Networks.Alfajores, 44787],
  ]);

  private async fireAccountsChangedHandler(account: Address) {
    console.info(`account changed: ${account}`);

    if (account !== null) {
      account = localStorage.getItem("PRIME_E2E_ADDRESS");
    }
    this.eventAggregator.publish("Network.Changed.Account", account);
  }
  private fireDisconnectHandler(error: { code: number; message: string }) {
    console.info(`disconnected: ${error?.code}: ${error?.message}`);
    this.eventAggregator.publish("Network.Changed.Disconnect", error);
  }

  public getDefaultSigner() {
    return {
      signMessage: async (message: string) => {
        const wallet = new ethers.Wallet(
          E2E_ADDRESSES_PRIVATE_KEYS[this.defaultAccountAddress],
        );
        return wallet.signMessage(message);
      },
    };
  }

  /**
   * provided by ethers given provider from Web3Modal
   */
  public walletProvider: Web3Provider;
  public defaultAccountAddress: Address;

  private async connect(): Promise<void> {
    /**
     * Difference to normal EthereumService: Only open Disclaimer, when clicking on "Connect to a Wallet" button.
     *   In E2e tests, the disclaimer modal popped up on first load, because localStorage is always cleared.
     */
    let account = localStorage.getItem("PRIME_E2E_ADDRESS") ?? E2E_ADDRESSES.CurveLabsMainLaunch;
    /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: EthereumServiceTesting.ts ~ line 104 ~ account", account);
    if (
      account &&
      !(await this.disclaimerService.ensurePrimeDisclaimed(account))
    ) {
      this.disconnect({
        code: -1,
        message: "User declined the Prime Deals disclaimer",
      });
      account = null;
    }

    if (account !== null) {
      this.setProvider();
    }
  }

  public ensureConnected(): boolean {
    /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: EthereumServiceTesting.ts ~ line 121 ~ ensureConnected");
    if (!this.defaultAccountAddress) {
      // TODO: make this await until we're either connected or not?
      this.connect();
      return false;
    } else {
      return true;
    }
  }

  /**
   * silently connect to metamask if a metamask account is already connected,
   * without invoking Web3Modal nor MetaMask popups.
   */
  public async connectToConnectedProvider(): Promise<void> {
    this.setProvider();
  }

  private async setProvider(): Promise<void> {
    /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: EthereumServiceTesting.ts ~ line 141 ~ setProvider");
    const account = localStorage.getItem("PRIME_E2E_ADDRESS");
    const mockFetchFunc: JsonRpcFetchFunc = (method: string) => {
      let payload;
      switch (method) {
        case "eth_accounts": {
          payload = [account];
          break;
        }
        default: {
          payload = method;
        }
      }
      return Promise.resolve(payload);
    };

    const walletProvider = new ethers.providers.Web3Provider(mockFetchFunc);

    this.walletProvider = walletProvider;

    this.walletProvider.lookupAddress = () => Promise.resolve("");

    let address = localStorage.getItem("PRIME_E2E_ADDRESS");
    if (address === "null") {
      address = null;
    } else if (address === "undefined") {
      address = undefined;
    }

    if (address === null || address === undefined) return;

    this.defaultAccountAddress = address;
    this.fireAccountsChangedHandler(address);

    /**
     * Simulate account changed from Metamask
        this.web3ModalProvider.on("accountsChanged", this.handleAccountsChanged);
     */
    this.eventAggregator.subscribe("accountsChanged", (account) => {
      this.defaultAccountAddress = account;
      this.fireAccountsChangedHandler(account);
    });
  }

  public disconnect(error: { code: number; message: string }): void {
    this.defaultAccountAddress = undefined;
    this.fireAccountsChangedHandler(null);
    this.walletProvider = undefined;
    this.fireDisconnectHandler(error);
  }

  /**
   *
   * @param provider should be a Web3Provider
   * @returns
   */
  public async switchToTargetedNetwork(): Promise<boolean> {
    return false;
  }

  public async addTokenToMetamask(
    _tokenAddress: Address,
    _tokenSymbol: string,
    _tokenDecimals: number,
    _tokenImage: string,
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  public getMetamaskHasToken(_tokenAddress: Address): boolean {
    return false;
  }

  public lastBlock: IBlockInfo;

  /**
   * so unit tests will be able to complete
   */
  public dispose(): void {}

  public getEtherscanLink(addressOrHash: Address | Hash, tx = false): string {
    let targetedNetwork = EthereumService.targetedNetwork as string;
    if (targetedNetwork === Networks.Mainnet) {
      targetedNetwork = "";
    } else {
      targetedNetwork = targetedNetwork + ".";
    }

    return `http://${targetedNetwork}etherscan.io/${
      tx ? "tx" : "address"
    }/${addressOrHash}`;
  }

  public getEnsForAddress(address: Address): Promise<string> {
    return this.walletProvider?.lookupAddress(address).catch(() => null);
  }

  /**
   * Returns address that is represented by the ENS.
   * Returns null if it can't resolve the ENS to an address
   * Returns address if it already is an address
   */
  public getAddressForEns(ens: string): Promise<Address> {
    /**
     * returns the address if ens already is an address
     */
    return this.walletProvider?.resolveName(ens).catch(() => null); // is neither address nor ENS
  }
}
