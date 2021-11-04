/* eslint-disable no-console */
import { EthereumService } from "services/EthereumService";
import { Address } from "./../services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { autoinject } from "aurelia-framework";
import { BigNumber } from "ethers";
import { BalancerService } from "services/BalancerService";
import { TransactionResponse } from "services/TransactionsService";

@autoinject
export class Vault {
  public contract: any;
  public address: Address;
  public poolId: Address;
  public projectTokenBalance: BigNumber;
  public fundingTokenBalance: BigNumber;
  private projectTokenIndex: any;
  private fundingTokenIndex: number;

  constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
  ) {
  }

  public async initialize(
    poolId: Address,
    projectTokenIndex: number,
    fundingTokenIndex: number): Promise<Vault> {

    this.poolId = poolId;
    this.address = BalancerService.VaultAddress;
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

  public async swap(
    amountToPay: BigNumber,
    fundingTokenAddress: Address,
    projectTokenAddress: Address,
    fakeIt = false,
  ): Promise<BigNumber | TransactionResponse> {

    const params = [
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
      BalancerService.Deadline,
    ];

    let result;

    if (fakeIt) {
      // result is the amount of tokenOut that would be paid-out by the swap
      result = await this.contract.callStatic.swap(...params);

    } else {
      result = await this.contract.swap(...params);
    }

    return result;
  }

}
