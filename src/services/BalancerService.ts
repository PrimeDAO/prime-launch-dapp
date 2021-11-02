import { ContractNames, ContractsService } from "services/ContractsService";
/* eslint-disable no-console */
import { SOR, SwapInfo, SwapTypes } from "@balancer-labs/sor";
import { MaxUint256, AddressZero } from "@ethersproject/constants";
import { ConsoleLogService } from "services/ConsoleLogService";
import { EthereumService, fromWei, Networks } from "services/EthereumService";
import { autoinject } from "aurelia-dependency-injection";
import { Utils } from "services/utils";
import { BigNumber, BigNumberish } from "ethers";
import { ITokenInfo } from "services/TokenTypes";
import { TransactionResponse } from "@ethersproject/providers";

const SUBGRAPH_URLS = {
  [Networks.Mainnet]:
    "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2",
  [Networks.Kovan]:
    "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2",
};

@autoinject
export class BalancerService {

  public SOR: any;
  private loading = true;
  // This is the same across networks
  static VaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

  static Deadline = Math.floor(Date.now() / 1000) + 3600; // an hour


  constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private consoleLogService: ConsoleLogService,
  ) {
  }

  public initialize(): Promise<void> {
    try {
      const balancerSubgraphUrl = SUBGRAPH_URLS[this.ethereumService.targetedNetwork];
      this.SOR = new SOR(this.ethereumService.readOnlyProvider as any, this.ethereumService.targetedChainId, balancerSubgraphUrl);
      // Update pools list with most recent onchain balances
      return this.SOR.fetchPools([], true);
    } catch (ex) {
      this.SOR = undefined;
      this.consoleLogService.logMessage(`Failed to initialize SOR: ${ex.error?.message ?? ex?.reason ?? ex?.message ?? ex}`, "error");
    } finally {
      this.loading = false;
    }
  }

  ensureInitialized(): Promise<void> {
    return Utils.waitUntilTrue(() => !this.loading, 9999999999);
  }


  public async getSwapFromSor(
    swapAmount: BigNumberish,
    tokenIn: ITokenInfo,
    tokenOut: ITokenInfo,
    swapType = SwapTypes.SwapExactIn,
  ): Promise<SwapInfo> {

    // gasPrice is used by SOR as a factor to determine how many pools to swap against.
    // i.e. higher cost means more costly to trade against lots of different pools.
    const gasPrice = BigNumber.from("40000000000");
    // This determines the max no of pools the SOR will use to swap.
    const maxPools = 4;
    const sor = this.SOR;

    // This calculates the cost to make a swap which is used as an input to sor to allow it to make gas efficient recommendations.
    // Note - tokenOut for SwapExactIn, tokenIn for SwapExactOut
    const outputToken =
        swapType === SwapTypes.SwapExactOut ? tokenIn : tokenOut;
    const cost = await sor.getCostOfSwapInToken(
      outputToken.address,
      outputToken.decimals,
      gasPrice,
      BigNumber.from("35000"),
    );
    console.log(`getCostOfSwapInToken: ${cost.toString()}`);

    const swapInfo: SwapInfo = await sor.getSwaps(
      tokenIn.address,
      tokenOut.address,
      swapType,
      swapAmount,
      { gasPrice, maxPools },
    );

    const amtInScaled =
        swapType === SwapTypes.SwapExactIn
          ? fromWei(swapAmount, tokenIn.decimals)
          : fromWei(swapInfo.returnAmount, tokenIn.decimals);
    const amtOutScaled =
        swapType === SwapTypes.SwapExactIn
          ? fromWei(swapInfo.returnAmount, tokenOut.decimals)
          : fromWei(swapAmount, tokenOut.decimals);

    const returnDecimals =
        swapType === SwapTypes.SwapExactIn
          ? tokenOut.decimals
          : tokenIn.decimals;

    const returnWithFees = fromWei(
      swapInfo.returnAmountConsideringFees,
      returnDecimals,
    );

    const costToSwapScaled = fromWei(cost, returnDecimals);

    const swapTypeStr =
        swapType === SwapTypes.SwapExactIn ? "SwapExactIn" : "SwapExactOut";
    console.log(swapTypeStr);
    console.log(`Token In: ${tokenIn.symbol}, Amt: ${amtInScaled.toString()}`);
    console.log(
      `Token Out: ${tokenOut.symbol}, Amt: ${amtOutScaled.toString()}`,
    );
    console.log(`Cost to swap: ${costToSwapScaled.toString()}`);
    console.log(`Return Considering Fees: ${returnWithFees.toString()}`);
    console.log("Swaps:");
    console.log(swapInfo.swaps);
    console.log(swapInfo.tokenAddresses);

    // will want the whole swapInfo for executing
    return swapInfo;
  }

  public async swapSor(
    // as obtained by getSwapFromSor
    swapInfo: SwapInfo,
    swapType = SwapTypes.SwapExactIn, // always
  ): Promise<TransactionResponse> {
    if (!swapInfo.returnAmount.gt(0)) {
      console.log("Return Amount is 0. No swaps to execute.");
      return;
    }
    // if (swapInfo.tokenIn !== AddressZero) {
    // Vault needs approval for swapping non ETH

    // commenting out cuz we're making the caller responsible
    // console.log("Checking vault allowance...");

    // const tokenInContract = this.contractsService.getContractAtAddress(ContractNames.ERC20, swapInfo.tokenIn);

    // let allowance = await tokenInContract.allowance(
    //   this.ethereumService.defaultAccountAddress,
    //   BalancerService.VaultAddress,
    // );

    // if (allowance.lt(swapInfo.swapAmount)) {
    //   console.log(
    //     `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`,
    //   );
    //   const txApprove = await tokenInContract.approve(BalancerService.VaultAddress, MaxUint256);
    //   await txApprove.wait();
    //   console.log(`Allowance updated: ${txApprove.hash}`);
    //   allowance = await tokenInContract.allowance(
    //     this.ethereumService.defaultAccountAddress,
    //     BalancerService.VaultAddress,
    //   );
    // }

    // console.log(`Allowance: ${allowance.toString()}`);
    // }

    const vaultContract = this.contractsService.getContractAtAddress(ContractNames.VAULT, BalancerService.VaultAddress);

    type FundManagement = {
      sender: string;
      recipient: string;
      fromInternalBalance: boolean;
      toInternalBalance: boolean;
    };

    const funds: FundManagement = {
      sender: this.ethereumService.defaultAccountAddress,
      recipient: this.ethereumService.defaultAccountAddress,
      fromInternalBalance: false,
      toInternalBalance: false,
    };

    // Limits:
    // +ve means max to send
    // -ve mean min to receive
    // For a multihop the intermediate tokens should be 0
    // This is where slippage tolerance would be added
    const limits: string[] = [];
    if (swapType === SwapTypes.SwapExactIn) {
      swapInfo.tokenAddresses.forEach((token, i) => {
        if (token.toLowerCase() === swapInfo.tokenIn.toLowerCase()) {
          limits[i] = swapInfo.swapAmount.toString();
        } else if (
          token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
        ) {
          limits[i] = swapInfo.returnAmount
            .mul(-1) // was -0.99 but that crashes
            .toString()
            .split(".")[0];
        } else {
          limits[i] = "0";
        }
      });
    } else {
      swapInfo.tokenAddresses.forEach((token, i) => {
        if (token.toLowerCase() === swapInfo.tokenIn.toLowerCase()) {
          limits[i] = swapInfo.returnAmount.toString();
        } else if (
          token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
        ) {
          limits[i] = swapInfo.swapAmount
            .mul(-1) // was -0.99 but that crashes
            .toString()
            .split(".")[0];
        } else {
          limits[i] = "0";
        }
      });
    }
    console.log(funds);
    console.log(swapInfo.tokenAddresses);
    console.log(limits);

    console.log("Swapping...");

    const overRides = {};
    // overRides['gasLimit'] = '200000';
    // overRides['gasPrice'] = '20000000000';
    // ETH in swaps must send ETH value
    if (swapInfo.tokenIn === AddressZero) {
      overRides["value"] = swapInfo.swapAmount.toString();
    }

    const tx = await vaultContract
      .batchSwap(
        swapType,
        swapInfo.swaps,
        swapInfo.tokenAddresses,
        funds,
        limits,
        BalancerService.Deadline,
        overRides,
      );

    console.log(`tx: ${tx.hash}`);

    return tx;
  }
}
