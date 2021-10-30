import { EthereumService } from "services/EthereumService";
import { Address } from "./../services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { autoinject } from "aurelia-framework";
import { BigNumber } from "ethers";

@autoinject
export class Vault {

  public contract: any;
  public address: Address;
  public poolId: Address;
  public projectTokenBalance: BigNumber;
  public fundingTokenBalance: BigNumber;
  private projectTokenIndex: any;
  private fundingTokenIndex: number;
  static deadline = Math.floor(Date.now() / 1000) + 3600; // an hour

  constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
  ) {
  }

  public async initialize(
    address: Address,
    poolId: Address,
    projectTokenIndex: number,
    fundingTokenIndex: number): Promise<Vault> {

    this.address = address;
    this.poolId = poolId;
    this.projectTokenIndex = projectTokenIndex;
    this.fundingTokenIndex = fundingTokenIndex;

    await this.loadContracts();

    await this.hydrate();

    return this;
  }

  public async hydrate(): Promise<void> {
    const poolTokensInfo = await this.contract.getPoolTokens(this.poolId);
    this.projectTokenBalance = poolTokensInfo.balances[this.projectTokenIndex];
    this.fundingTokenBalance = poolTokensInfo.balances[this.fundingTokenIndex];
  }

  public async loadContracts(): Promise<void> {
    this.contract = await this.contractsService.getContractAtAddress(ContractNames.VAULT, this.address);
  }


  public async simulateSwap(
    amountToPay: BigNumber,
    fundingTokenAddress: Address,
    projectTokenAddress: Address): Promise<BigNumber> {

    const result = await this.contract.callStatic.swap(
      {
        poolId: this.poolId,
        kind: 0, // GIVEN_IN,
        assetIn: fundingTokenAddress,
        assetOut: projectTokenAddress,
        amount: amountToPay,
        userData: [],
      },
      {
        sender: this.ethereumService.defaultAccountAddress,
        fromInternalBalance: false,
        recipient: this.ethereumService.defaultAccountAddress,
        toInternalBalance: false,
      },
      "0", // amountOut must be greter than this
      Vault.deadline,
    );
    console.dir(result);
    return result;
  }
}
