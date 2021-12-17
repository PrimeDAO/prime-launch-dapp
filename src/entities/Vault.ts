import { Address } from "services/EthereumService";
/* eslint-disable no-console */
import { EthereumService } from "services/EthereumService";
import { ContractNames, ContractsService, IStandardEvent } from "services/ContractsService";
import { autoinject } from "aurelia-framework";
import { BigNumber } from "ethers";
import { BalancerService } from "services/BalancerService";
import { TransactionResponse } from "services/TransactionsService";
import { StartingBlockNumber } from "services/LbpManagerService";

export interface ITokenTotals {
  fundingStart: BigNumber;
  projectStart: BigNumber;
  fundingRaised: BigNumber;
  projectSold: BigNumber;
}

interface IPoolBalanceChangedEventArgs {
  poolId: string;
  liquidityProvider: Address;
  tokens: Array<Address>;
  deltas: Array<BigNumber>;
  protocolFeeAmounts: Array<BigNumber>;
}

@autoinject
export class Vault {
  public contract: any;
  public address: Address;
  public poolId: string;
  public lbpAdminAddress: Address;
  public projectTokenBalance: BigNumber;
  public fundingTokenBalance: BigNumber;
  public projectTokenEndingBalance: BigNumber;
  public fundingTokenEndingBalance: BigNumber;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  public tokenTotals = {} as ITokenTotals;
  public isDefunded = false;
  private projectTokenIndex: any;
  private fundingTokenIndex: number;

  constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
  ) {
  }

  public async initialize(
    lbpAdminAddress: Address,
    poolId: string,
    projectTokenIndex: number,
    fundingTokenIndex: number): Promise<Vault> {

    this.lbpAdminAddress = lbpAdminAddress;
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
    this.tokenTotals = await this.getTokenTotals();
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
      BalancerService.Deadline(),
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

  private async getTokenTotals(): Promise<ITokenTotals> {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const totals = {} as ITokenTotals;
    const filter = this.contract.filters.PoolBalanceChanged(this.poolId);

    return this.contract.queryFilter(filter, StartingBlockNumber)
      .then(async (events: Array<IStandardEvent<IPoolBalanceChangedEventArgs>>) => {
        if (events[0]) {
          totals.fundingStart = events[0].args.deltas[this.fundingTokenIndex];
          totals.projectStart = events[0].args.deltas[this.projectTokenIndex];
        }
        if (events[1]) {
          this.isDefunded = true;

          totals.fundingRaised = events[1].args.deltas[this.fundingTokenIndex].abs().sub(totals.fundingStart);
          totals.projectSold = events[1].args.deltas[this.projectTokenIndex].add(totals.projectStart);

          this.fundingTokenEndingBalance = events[1].args.deltas[this.fundingTokenIndex].abs().add(this.fundingTokenBalance);
          this.projectTokenEndingBalance = events[1].args.deltas[this.projectTokenIndex].abs().add(this.projectTokenBalance);
        } else {
          // includes fees
          totals.fundingRaised = this.fundingTokenBalance.sub(totals.fundingStart);
          totals.projectSold = totals.projectStart.sub(this.projectTokenBalance);
        }
        return totals;
      });
  }
}
