import { MaxUint256, AddressZero } from "@ethersproject/constants";
/* eslint-disable no-console */
import { EthereumService, fromWei, Networks } from "services/EthereumService";
import { Address } from "./../services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { autoinject } from "aurelia-framework";
import { BigNumber, BigNumberish } from "ethers";
// import { SOR, SwapInfo, SwapTypes } from "@balancer-labs/sor";
import { TransactionReceipt } from "@ethersproject/providers";
import { ITokenInfo } from "services/TokenTypes";


const SUBGRAPH_URLS = {
  [Networks.Mainnet]:
    "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2",
  [Networks.Rinkeby]:
    "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-rinkeby-v2",
};

@autoinject
export class Vault {

  // This is the same across networks
  static VaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  static Deadline = Math.floor(Date.now() / 1000) + 3600; // an hour

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
    this.contract = await this.contractsService.getContractAtAddress(ContractNames.VAULT, Vault.VaultAddress);
  }


  public async swap(
    amountToPay: BigNumber,
    fundingTokenAddress: Address,
    projectTokenAddress: Address,
    fakeIt = false,
  ): Promise<BigNumber | TransactionReceipt> {

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
      Vault.Deadline,
    ];

    let result;

    if (fakeIt) {
      // result is the amount of tokenOut that would be paid-out by the swap
      result = await this.contract.callStatic.swap(...params);

    } else {
      result = await this.contract.swap(...params);
    }

    console.dir(result);
    return result;
  }

  // public async getSwapFromSor(
  //   swapAmount: BigNumberish,
  //   tokenIn: ITokenInfo,
  //   tokenOut: ITokenInfo,
  //   swapType = SwapTypes.SwapExactIn,
  // ): Promise<SwapInfo> {

  //   const balancerSubgraphUrl = SUBGRAPH_URLS[this.ethereumService.targetedNetwork];

  //   const sor = new SOR(this.ethereumService.readOnlyProvider as any, this.ethereumService.targetedChainId, balancerSubgraphUrl);

  //   // Update pools list with most recent onchain balances
  //   await sor.fetchPools([], true);

  //   // gasPrice is used by SOR as a factor to determine how many pools to swap against.
  //   // i.e. higher cost means more costly to trade against lots of different pools.
  //   const gasPrice = BigNumber.from("40000000000");
  //   // This determines the max no of pools the SOR will use to swap.
  //   const maxPools = 4;

  //   // This calculates the cost to make a swap which is used as an input to sor to allow it to make gas efficient recommendations.
  //   // Note - tokenOut for SwapExactIn, tokenIn for SwapExactOut
  //   const outputToken =
  //       swapType === SwapTypes.SwapExactOut ? tokenIn : tokenOut;
  //   const cost = await sor.getCostOfSwapInToken(
  //     outputToken.address,
  //     outputToken.decimals,
  //     gasPrice,
  //     BigNumber.from("35000"),
  //   );
  //   console.log(`getCostOfSwapInToken: ${cost.toString()}`);

  //   const swapInfo: SwapInfo = await sor.getSwaps(
  //     tokenIn.address,
  //     tokenOut.address,
  //     swapType,
  //     swapAmount,
  //     { gasPrice, maxPools },
  //   );

  //   const amtInScaled =
  //       swapType === SwapTypes.SwapExactIn
  //         ? fromWei(swapAmount, tokenIn.decimals)
  //         : fromWei(swapInfo.returnAmount, tokenIn.decimals);
  //   const amtOutScaled =
  //       swapType === SwapTypes.SwapExactIn
  //         ? fromWei(swapInfo.returnAmount, tokenOut.decimals)
  //         : fromWei(swapAmount, tokenOut.decimals);

  //   const returnDecimals =
  //       swapType === SwapTypes.SwapExactIn
  //         ? tokenOut.decimals
  //         : tokenIn.decimals;

  //   const returnWithFees = fromWei(
  //     swapInfo.returnAmountConsideringFees,
  //     returnDecimals,
  //   );

  //   const costToSwapScaled = fromWei(cost, returnDecimals);

  //   const swapTypeStr =
  //       swapType === SwapTypes.SwapExactIn ? "SwapExactIn" : "SwapExactOut";
  //   console.log(swapTypeStr);
  //   console.log(`Token In: ${tokenIn.symbol}, Amt: ${amtInScaled.toString()}`);
  //   console.log(
  //     `Token Out: ${tokenOut.symbol}, Amt: ${amtOutScaled.toString()}`,
  //   );
  //   console.log(`Cost to swap: ${costToSwapScaled.toString()}`);
  //   console.log(`Return Considering Fees: ${returnWithFees.toString()}`);
  //   console.log("Swaps:");
  //   console.log(swapInfo.swaps);
  //   console.log(swapInfo.tokenAddresses);

  //   // will want the whole swapInfo for executing
  //   return swapInfo;
  // }

  // public async swapSor(
  //   // as obtained by getSwapFromSor
  //   swapInfo: SwapInfo,
  //   swapType = SwapTypes.SwapExactIn, // always
  // ): Promise<void> {
  //   if (!swapInfo.returnAmount.gt(0)) {
  //     console.log("Return Amount is 0. No swaps to execute.");
  //     return;
  //   }

  //   if (swapInfo.tokenIn !== AddressZero) {
  //     // Vault needs approval for swapping non ETH
  //     console.log("Checking vault allowance...");

  //     const tokenInContract = this.contractsService.getContractAtAddress(ContractNames.ERC20, swapInfo.tokenIn);

  //     let allowance = await tokenInContract.allowance(
  //       this.ethereumService.defaultAccountAddress,
  //       Vault.VaultAddress,
  //     );

  //     if (allowance.lt(swapInfo.swapAmount)) {
  //       console.log(
  //         `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`,
  //       );
  //       const txApprove = await tokenInContract.approve(Vault.VaultAddress, MaxUint256);
  //       await txApprove.wait();
  //       console.log(`Allowance updated: ${txApprove.hash}`);
  //       allowance = await tokenInContract.allowance(
  //         this.ethereumService.defaultAccountAddress,
  //         Vault.VaultAddress,
  //       );
  //     }

  //     console.log(`Allowance: ${allowance.toString()}`);
  //   }

  //   const vaultContract = this.contractsService.getContractAtAddress(ContractNames.VAULT, Vault.VaultAddress);

  //   type FundManagement = {
  //     sender: string;
  //     recipient: string;
  //     fromInternalBalance: boolean;
  //     toInternalBalance: boolean;
  //   };

  //   const funds: FundManagement = {
  //     sender: this.ethereumService.defaultAccountAddress,
  //     recipient: this.ethereumService.defaultAccountAddress,
  //     fromInternalBalance: false,
  //     toInternalBalance: false,
  //   };

  //   // Limits:
  //   // +ve means max to send
  //   // -ve mean min to receive
  //   // For a multihop the intermediate tokens should be 0
  //   // This is where slippage tolerance would be added
  //   const limits: string[] = [];
  //   if (swapType === SwapTypes.SwapExactIn) {
  //     swapInfo.tokenAddresses.forEach((token, i) => {
  //       if (token.toLowerCase() === swapInfo.tokenIn.toLowerCase()) {
  //         limits[i] = swapInfo.swapAmount.toString();
  //       } else if (
  //         token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
  //       ) {
  //         limits[i] = swapInfo.returnAmount
  //           .mul(-0.99)
  //           .toString()
  //           .split(".")[0];
  //       } else {
  //         limits[i] = "0";
  //       }
  //     });
  //   } else {
  //     swapInfo.tokenAddresses.forEach((token, i) => {
  //       if (token.toLowerCase() === swapInfo.tokenIn.toLowerCase()) {
  //         limits[i] = swapInfo.returnAmount.toString();
  //       } else if (
  //         token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
  //       ) {
  //         limits[i] = swapInfo.swapAmount
  //           .mul(-0.99)
  //           .toString()
  //           .split(".")[0];
  //       } else {
  //         limits[i] = "0";
  //       }
  //     });
  //   }
  //   console.log(funds);
  //   console.log(swapInfo.tokenAddresses);
  //   console.log(limits);

  //   console.log("Swapping...");

  //   const overRides = {};
  //   // overRides['gasLimit'] = '200000';
  //   // overRides['gasPrice'] = '20000000000';
  //   // ETH in swaps must send ETH value
  //   if (swapInfo.tokenIn === AddressZero) {
  //     overRides["value"] = swapInfo.swapAmount.toString();
  //   }

  //   const tx = await vaultContract
  //     .batchSwap(
  //       swapType,
  //       swapInfo.swaps,
  //       swapInfo.tokenAddresses,
  //       funds,
  //       limits,
  //       Vault.Deadline,
  //       overRides,
  //     );

  //   console.log(`tx: ${tx.hash}`);
  // }
}
