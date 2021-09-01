import axios from "axios";
import { autoinject } from "aurelia-framework";
import { ContractNames, ContractsService } from "./ContractsService";
import { getAddress } from "ethers/lib/utils";
import { EthereumService } from "services/EthereumService";
import { Contract, ethers } from "ethers";
import { IErc20Token, ITokenInfo } from "services/TokenTypes";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ITokenList, TokenListMap } from "services/TokenListService";
// import { Multicaller } from '@/lib/utils/balancer/contract';

// export interface ITags {
//   readonly [tagId: string]: {
//     readonly name: string;
//     readonly description: string;
//   };
// }

/**
 * Object of token infos key'd by their address
 */
export type TokenInfoMap = { [address: string]: ITokenInfo };

@autoinject
export default class TokenMetadataService {

  constructor(
    private ethereumService: EthereumService,
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService) { }

  /**
   * Tries to find metadata for the given token addresses via all provided
   * TokenLists.
   *
   * If token metadata can't be found in the lists, resorts to invoking
   * functions on the token contract.
   *
   * If can't find a working token contract, then the offending address
   * will not be included in the metaDict.
   */
  public async fetchTokenMetadata(
    addresses: string[],
    tokenLists: TokenListMap,
  ): Promise<TokenInfoMap> {
    addresses = addresses.map(address => getAddress(address));
    const tokenListTokens = this.tokenListsTokensFrom(tokenLists);
    let metaDict = this.getMetaFromLists(addresses, tokenListTokens);

    // If token meta can't be found in TokenLists, fetch onchain
    const unknownAddresses = addresses.filter(
      address => !Object.keys(metaDict).includes(address),
    );
    if (unknownAddresses.length > 0) {
      const onchainMeta = await this.getMetaOnchain(addresses);
      metaDict = { ...metaDict, ...onchainMeta };
    }

    return metaDict;
  }

  private tokenListsTokensFrom(lists: TokenListMap): ITokenInfo[] {
    return Object.values<ITokenList>(lists)
      .map(list => list?.tokens ?? [])
      .flat();
  }

  private getMetaFromLists(
    addresses: string[],
    tokens: ITokenInfo[],
  ): TokenInfoMap {
    const metaDict = {};

    addresses.forEach(async address => {
      const tokenMeta = tokens.find(
        token => getAddress(token.address) === address,
      );
      if (tokenMeta)
        metaDict[address] = {
          ...tokenMeta,
          address,
        };
    });

    return metaDict;
  }

  private async getMetaOnchain(addresses: string[]): Promise<TokenInfoMap> {
    try {

      const metaDict = {};

      for await (const address of addresses) {
        const tokenContract = new ethers.Contract(
          address,
          ContractsService.getContractAbi(ContractNames.IERC20),
          this.ethereumService.readOnlyProvider) as unknown as Contract & IErc20Token;

        const tokenInfo: ITokenInfo = { address } as unknown as ITokenInfo;
        try {
          const logoURI = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
          const logoFound = await axios.get(logoURI).catch(() => null);
          tokenInfo.logoURI = logoFound ? logoURI : null;
          /**
           * none of the following functions are required by IERC20, so we will tolerate their
           * absence since we have fallbacks.  But we must nevertheless fail here if decimals
           * is missing.  We and our contracts assume 18.
           */
          try {
            tokenInfo.name = await tokenContract.name();
            tokenInfo.symbol = await tokenContract.symbol();
          // eslint-disable-next-line no-empty
          } catch { }
          tokenInfo.decimals = await tokenContract.decimals();
          metaDict[address] = tokenInfo as unknown as ITokenInfo;
        // eslint-disable-next-line no-empty
        } catch (ex) {
          this.consoleLogService.logMessage(`getMetaOnchain: ${ex.message ?? ex} `, "error");
        }
      }

      return metaDict;

    } catch (error) {
      this.consoleLogService.logMessage(`Failed to fetch onchain token metadata: ${error?.message}`, "error");
      return {};
    }
  }

  // private async getMetaOnchain(addresses: string[]): Promise<TokenInfoMap> {
  //   try {
  //     const network = this.service.configService.network.key;
  //     const multi = new Multicaller(network, this.service.provider, erc20Abi);
  //     const metaDict = {};

  //     addresses.forEach(address => {
  //       set(metaDict, `${address}.address`, address);
  //       // set(metaDict, `${address}.chainId`, parseInt(network));
  //       set(
  //         metaDict,
  //         `${address}.logoURI`,
  //         `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`,
  //       );
  //       multi.call(`${address}.name`, address, "name");
  //       multi.call(`${address}.symbol`, address, "symbol");
  //       multi.call(`${address}.decimals`, address, "decimals");
  //     });

  //     return await multi.execute(metaDict);
  //   } catch (error) {
  //     console.error("Failed to fetch onchain meta", addresses, error);
  //     return {};
  //   }
  // }
}
