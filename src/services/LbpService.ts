import { ITokenInfo } from "services/TokenTypes";
import { Address } from "services/EthereumService";
import { autoinject } from "aurelia-dependency-injection";
import { ContractNames, ContractsService, IStandardEvent } from "services/ContractsService";
import { TokenService } from "services/TokenService";
import { TokenListService } from "services/TokenListService";


interface ITokensRegisteredEventArgs {
  poolId: string;
  tokens: Array<Address>;
  assetManagers: Array<Address>
}

@autoinject
export class LbpService {

  vaultContract: any;
  tokenPairs

  constructor(
    private contractsService: ContractsService,
    private tokenService: TokenService,
    private tokenListService: TokenListService,
  ) {
  }

  public initialize(): Promise<void> {

    const tokenInfos = this.tokenService.getTokenInfosFromTokenList(this.tokenListService.tokenLists.PrimeDao.Payments);
    const tokenList = new Set(tokenInfos.map((tokenInfo: ITokenInfo) => tokenInfo.address.toLowerCase()));

    this.vaultContract = this.contractsService.getContractAtAddress(ContractNames.VAULT, "0xBA12222222228d8Ba445958a75a0704d566BF2C8");
    const eventFilter = this.vaultContract.filters.TokensRegistered();
    return this.vaultContract.queryFilter(eventFilter)
      .then(async (txEvents: Array<IStandardEvent<ITokensRegisteredEventArgs>>) => {
        for (const event of txEvents) {
          const tokens = event.args.tokens;
          const poolId = event.args.poolId;
          if (tokens.length === 2) {
            if (tokenList.has(tokens[0].toLowerCase()) || tokenList.has(tokens[1].toLowerCase())) {
              console.dir(tokens);
            }
          }
        }
      });
  }
}
