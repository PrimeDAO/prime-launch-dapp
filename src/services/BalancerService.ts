import { ContractNames, ContractsService } from "services/ContractsService";
import { SOR, SwapInfo, SwapTypes } from "@balancer-labs/sor";
import { AddressZero } from "@ethersproject/constants";
import { ConsoleLogService } from "services/ConsoleLogService";
import { EthereumService, Networks } from "services/EthereumService";
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
  [Networks.Rinkeby]:
    "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-rinkeby-v2",
};

@autoinject
export class BalancerService {

  public SOR: any;
  private loading = true;
  // This is the same across networks
  static VaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

  static Deadline = (): number => Math.floor(Date.now() / 1000) + 3600; // an hour

  constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private consoleLogService: ConsoleLogService,
  ) {
  }

  public async initialize(): Promise<void> {
    try {
      let success = false;
      const balancerSubgraphUrl = SUBGRAPH_URLS[EthereumService.targetedNetwork];
      const sor = new SOR(this.ethereumService.readOnlyProvider as any, EthereumService.targetedChainId, balancerSubgraphUrl);
      if (sor) { // yes, can be undefined
        // Update pools list with most recent onchain balances
        success = await sor.fetchPools([], true);
      }
      if (success) {
        this.SOR = sor;
      } else {
        throw new Error("Failed to fetch pools");
      }
    } catch (ex) {
      this.SOR = undefined;
      const msg = `Failed to initialize SOR: ${Utils.extractExceptionMessage(ex)}`;
      this.consoleLogService.logMessage(msg, "error");
      throw new Error(msg);
    } finally {
      this.loading = false;
    }
  }

  /** returns true if SOR was properly initialized */
  ensureInitialized(): Promise<boolean> {
    if (!this.loading && !this.SOR) {
      // try again
      this.initialize();
    }
    return Utils.waitUntilTrue(() => !this.loading, 9999999999)
      .then(() => {
        return !!this.SOR;
      });
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
    // const outputToken =
    //     swapType === SwapTypes.SwapExactOut ? tokenIn : tokenOut;
    // const cost = await sor.getCostOfSwapInToken(
    //   outputToken.address,
    //   outputToken.decimals,
    //   gasPrice,
    //   BigNumber.from("35000"),
    // );
    // console.log(`getCostOfSwapInToken: ${cost.toString()}`);

    const swapInfo: SwapInfo = await sor.getSwaps(
      tokenIn.address,
      tokenOut.address,
      swapType,
      swapAmount,
      { gasPrice, maxPools },
    );

    // const amtInScaled =
    //     swapType === SwapTypes.SwapExactIn
    //       ? fromWei(swapAmount, tokenIn.decimals)
    //       : fromWei(swapInfo.returnAmount, tokenIn.decimals);
    // const amtOutScaled =
    //     swapType === SwapTypes.SwapExactIn
    //       ? fromWei(swapInfo.returnAmount, tokenOut.decimals)
    //       : fromWei(swapAmount, tokenOut.decimals);

    // const returnDecimals =
    //     swapType === SwapTypes.SwapExactIn
    //       ? tokenOut.decimals
    //       : tokenIn.decimals;

    // const returnWithFees = fromWei(
    //   swapInfo.returnAmountConsideringFees,
    //   returnDecimals,
    // );

    // const costToSwapScaled = fromWei(cost, returnDecimals);

    // const swapTypeStr =
    //     swapType === SwapTypes.SwapExactIn ? "SwapExactIn" : "SwapExactOut";
    // console.log(swapTypeStr);
    // console.log(`Token In: ${tokenIn.symbol}, Amt: ${amtInScaled.toString()}`);
    // console.log(
    //   `Token Out: ${tokenOut.symbol}, Amt: ${amtOutScaled.toString()}`,
    // );
    // console.log(`Cost to swap: ${costToSwapScaled.toString()}`);
    // console.log(`Return Considering Fees: ${returnWithFees.toString()}`);
    // console.log("Swaps:");
    // console.log(swapInfo.swaps);
    // console.log(swapInfo.tokenAddresses);

    // will want the whole swapInfo for executing
    return swapInfo;
  }

  public async swapSor(
    // as obtained by getSwapFromSor
    swapInfo: SwapInfo,
    swapType = SwapTypes.SwapExactIn, // always
  ): Promise<TransactionResponse> {
    if (!swapInfo.returnAmount.gt(0)) {
      // console.log("Return Amount is 0. No swaps to execute.");
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

    const funds = {
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
        } else if (token.toLowerCase() === swapInfo.tokenOut.toLowerCase()) {
          limits[i] = swapInfo.returnAmount
            .mul(-99)
            .div(100)
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
        } else if (token.toLowerCase() === swapInfo.tokenOut.toLowerCase()) {
          limits[i] = swapInfo.swapAmount
            .mul(-99)
            .div(100)
            .toString()
            .split(".")[0];
        } else {
          limits[i] = "0";
        }
      });
    }
    // console.log(funds);
    // console.log(swapInfo.tokenAddresses);
    // console.log(limits);

    // console.log("Swapping...");

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
        BalancerService.Deadline(),
        overRides,
      );

    // console.log(`tx: ${tx.hash}`);

    return tx;
  }

  /**
   * Error codes
   */
  static isErrorCode = (error: string): boolean => {
    if (!error.includes("BAL#")) return false;

    const errorCode = error.replace("BAL#", "");
    return Object.keys(balancerErrorCodes).includes(errorCode);
  };

  /**
   * Decodes a Balancer error code into the corresponding reason
   * @param error - a Balancer error code of the form `BAL#000`
   * @returns The decoded error reason
   */
  static parseErrorCode = (error: string): string => {
    if (!error.includes("BAL#")) throw new Error("Error code not found");
    const errorCode = error.replace("execution reverted: ", "").replace("BAL#", "");

    const actualError = balancerErrorCodes[errorCode];

    if (!actualError) throw new Error("Error code not found");

    return actualError;
  };

  /**
   * Decodes a Balancer error code into the corresponding reason
   * @param error - a Balancer error code of the form `BAL#000`
   * @returns The decoded error reason if passed a valid error code, otherwise returns passed input
   */
  static tryParseErrorCode = (error: string): string => {
    try {
      return BalancerService.parseErrorCode(error);
    } catch {
      return error;
    }
  };

  static tryFriendlyErrorCode = (error: string): string => {
    try {
      return BalancerService.parseErrorCode(error);
    } catch {
      return error;
    }
  }
}

const balancerErrorCodes: Record<string, string> = {
  "000": "Add overflow", // ADD_OVERFLOW
  "001": "Sub overflow", // SUB_OVERFLOW
  "002": "Sub underflow", // SUB_UNDERFLOW
  "003": "Mul overflow", // MUL_OVERFLOW
  "004": "Zero division", // ZERO_DIVISION
  "005": "Div internal", // DIV_INTERNAL
  "006": "X out of bounds", // X_OUT_OF_BOUNDS
  "007": "Y out of bounds", // Y_OUT_OF_BOUNDS
  "008": "Product out of bounds", // PRODUCT_OUT_OF_BOUNDS
  "009": "Invalid exponent", // INVALID_EXPONENT
  "100": "Out of bounds", // OUT_OF_BOUNDS
  "101": "Unsorted array", // UNSORTED_ARRAY
  "102": "Unsorted tokens", // UNSORTED_TOKENS
  "103": "Input length mismatch", // INPUT_LENGTH_MISMATCH
  "104": "Zero token", // ZERO_TOKEN
  "200": "Min tokens", // MIN_TOKENS
  "201": "Max tokens", // MAX_TOKENS
  "202": "Max swap fee percentage", // MAX_SWAP_FEE_PERCENTAGE
  "203": "Min swap fee percentage", // MIN_SWAP_FEE_PERCENTAGE
  "204": "Minimum bpt", // MINIMUM_BPT
  "205": "Caller not vault", // CALLER_NOT_VAULT
  "206": "Uninitialized", // UNINITIALIZED
  "207": "Bpt in max amount", // BPT_IN_MAX_AMOUNT
  "208": "Bpt out min amount", // BPT_OUT_MIN_AMOUNT
  "209": "Expired permit", // EXPIRED_PERMIT
  "210": "Not two tokens", // NOT_TWO_TOKENS
  "300": "Min amp", // MIN_AMP
  "301": "Max amp", // MAX_AMP
  "302": "Min weight", // MIN_WEIGHT
  "303": "Max stable tokens", // MAX_STABLE_TOKENS
  "304": "Funding token amount may not be larger than 30% of the Lbp's total balance", // MAX_IN_RATIO
  "305": "Max out ratio", // MAX_OUT_RATIO
  "306": "Min bpt in for token out", // MIN_BPT_IN_FOR_TOKEN_OUT
  "307": "Max out bpt for token in", // MAX_OUT_BPT_FOR_TOKEN_IN
  "308": "Normalized weight invariant", // NORMALIZED_WEIGHT_INVARIANT
  "309": "Invalid token", // INVALID_TOKEN
  "310": "Unhandled join kind", // UNHANDLED_JOIN_KIND
  "311": "Zero invariant", // ZERO_INVARIANT
  "312": "Oracle invalid seconds query", // ORACLE_INVALID_SECONDS_QUERY
  "313": "Oracle not initialized", // ORACLE_NOT_INITIALIZED
  "314": "Oracle query too old", // ORACLE_QUERY_TOO_OLD
  "315": "Oracle invalid index", // ORACLE_INVALID_INDEX
  "316": "Oracle bad secs", // ORACLE_BAD_SECS
  "317": "Amp end time too close", // AMP_END_TIME_TOO_CLOSE
  "318": "Amp ongoing update", // AMP_ONGOING_UPDATE
  "319": "Amp rate too high", // AMP_RATE_TOO_HIGH
  "320": "Amp no ongoing update", // AMP_NO_ONGOING_UPDATE
  "321": "Stable invariant didnt converge", // STABLE_INVARIANT_DIDNT_CONVERGE
  "322": "Stable get balance didnt converge", // STABLE_GET_BALANCE_DIDNT_CONVERGE
  "323": "Relayer not contract", // RELAYER_NOT_CONTRACT
  "324": "Base pool relayer not called", // BASE_POOL_RELAYER_NOT_CALLED
  "325": "Rebalancing relayer reentered", // REBALANCING_RELAYER_REENTERED
  "326": "Gradual update time travel", // GRADUAL_UPDATE_TIME_TRAVEL
  "327": "Swaps disabled", // SWAPS_DISABLED
  "328": "Caller is not lbp owner", // CALLER_IS_NOT_LBP_OWNER
  "329": "Price rate overflow", // PRICE_RATE_OVERFLOW
  "330": "Invalid join exit kind while swaps disabled", // INVALID_JOIN_EXIT_KIND_WHILE_SWAPS_DISABLED
  "331": "Weight change too fast", // WEIGHT_CHANGE_TOO_FAST
  "332": "Lower greater than upper target", // LOWER_GREATER_THAN_UPPER_TARGET
  "333": "Upper target too high", // UPPER_TARGET_TOO_HIGH
  "334": "Unhandled by linear pool", // UNHANDLED_BY_LINEAR_POOL
  "335": "Out of target range", // OUT_OF_TARGET_RANGE
  "336": "Unhandled exit kind ", // UNHANDLED_EXIT_KIND
  "337": "Unauthorized exit", // UNAUTHORIZED_EXIT
  "338": "Max management swap fee percentage", // MAX_MANAGEMENT_SWAP_FEE_PERCENTAGE
  "339": "Unhandled by managed pool", // UNHANDLED_BY_MANAGED_POOL
  "340": "Unhandled by phantom pool", // UNHANDLED_BY_PHANTOM_POOL
  "341": "Token does not have rate provider", // TOKEN_DOES_NOT_HAVE_RATE_PROVIDER
  "342": "Invalid initialization", // INVALID_INITIALIZATION
  "400": "Reentrancy", // REENTRANCY
  "401": "Sender not allowed", // SENDER_NOT_ALLOWED
  "402": "Paused", // PAUSED
  "403": "Pause window expired", // PAUSE_WINDOW_EXPIRED
  "404": "Max pause window duration", // MAX_PAUSE_WINDOW_DURATION
  "405": "Max buffer period duration", // MAX_BUFFER_PERIOD_DURATION
  "406": "Insufficient balance", // INSUFFICIENT_BALANCE
  "407": "Insufficient allowance", // INSUFFICIENT_ALLOWANCE
  "408": "Erc20 transfer from zero address", // ERC20_TRANSFER_FROM_ZERO_ADDRESS
  "409": "Erc20 transfer to zero address", // ERC20_TRANSFER_TO_ZERO_ADDRESS
  "410": "Erc20 mint to zero address", // ERC20_MINT_TO_ZERO_ADDRESS
  "411": "Erc20 burn from zero address", // ERC20_BURN_FROM_ZERO_ADDRESS
  "412": "Erc20 approve from zero address", // ERC20_APPROVE_FROM_ZERO_ADDRESS
  "413": "Erc20 approve to zero address", // ERC20_APPROVE_TO_ZERO_ADDRESS
  "414": "Erc20 transfer exceeds allowance", // ERC20_TRANSFER_EXCEEDS_ALLOWANCE
  "415": "Erc20 decreased allowance below zero", // ERC20_DECREASED_ALLOWANCE_BELOW_ZERO
  "416": "Erc20 transfer exceeds balance", // ERC20_TRANSFER_EXCEEDS_BALANCE
  "417": "Erc20 burn exceeds allowance", // ERC20_BURN_EXCEEDS_ALLOWANCE
  "418": "Safe erc20 call failed", // SAFE_ERC20_CALL_FAILED
  "419": "Address insufficient balance", // ADDRESS_INSUFFICIENT_BALANCE
  "420": "Address cannot send value", // ADDRESS_CANNOT_SEND_VALUE
  "421": "Safe cast value cant fit int256", // SAFE_CAST_VALUE_CANT_FIT_INT256
  "422": "Grant sender not admin", // GRANT_SENDER_NOT_ADMIN
  "423": "Revoke sender not admin", // REVOKE_SENDER_NOT_ADMIN
  "424": "Renounce sender not allowed", // RENOUNCE_SENDER_NOT_ALLOWED
  "425": "Buffer period expired", // BUFFER_PERIOD_EXPIRED
  "426": "Caller is not owner", // CALLER_IS_NOT_OWNER
  "427": "New owner is zero", // NEW_OWNER_IS_ZERO
  "428": "Code deployment failed", // CODE_DEPLOYMENT_FAILED
  "429": "Call to non contract", // CALL_TO_NON_CONTRACT
  "430": "Low level call failed", // LOW_LEVEL_CALL_FAILED
  "431": "Not paused", // NOT_PAUSED
  "500": "Invalid pool id", // INVALID_POOL_ID
  "501": "Caller not pool", // CALLER_NOT_POOL
  "502": "Sender not asset manager", // SENDER_NOT_ASSET_MANAGER
  "503": "User doesnt allow relayer", // USER_DOESNT_ALLOW_RELAYER
  "504": "Invalid signature", // INVALID_SIGNATURE
  "505": "Exit below min", // EXIT_BELOW_MIN
  "506": "Join above max", // JOIN_ABOVE_MAX
  "507": "Swap limit", // SWAP_LIMIT
  "508": "Swap deadline", // SWAP_DEADLINE
  "509": "Cannot swap same token", // CANNOT_SWAP_SAME_TOKEN
  "510": "Unknown amount in first swap", // UNKNOWN_AMOUNT_IN_FIRST_SWAP
  "511": "Malconstructed multihop swap", // MALCONSTRUCTED_MULTIHOP_SWAP
  "512": "Internal balance overflow", // INTERNAL_BALANCE_OVERFLOW
  "513": "Insufficient internal balance", // INSUFFICIENT_INTERNAL_BALANCE
  "514": "Invalid eth internal balance", // INVALID_ETH_INTERNAL_BALANCE
  "515": "Invalid post loan balance", // INVALID_POST_LOAN_BALANCE
  "516": "Insufficient eth", // INSUFFICIENT_ETH
  "517": "Unallocated eth", // UNALLOCATED_ETH
  "518": "Eth transfer", // ETH_TRANSFER
  "519": "Cannot use eth sentinel", // CANNOT_USE_ETH_SENTINEL
  "520": "Tokens mismatch", // TOKENS_MISMATCH
  "521": "Token not registered", // TOKEN_NOT_REGISTERED
  "522": "Token already registered", // TOKEN_ALREADY_REGISTERED
  "523": "Tokens already set", // TOKENS_ALREADY_SET
  "524": "Tokens length must be 2", // TOKENS_LENGTH_MUST_BE_2
  "525": "Nonzero token balance", // NONZERO_TOKEN_BALANCE
  "526": "Balance total overflow", // BALANCE_TOTAL_OVERFLOW
  "527": "Pool no tokens", // POOL_NO_TOKENS
  "528": "Insufficient flash loan balance", // INSUFFICIENT_FLASH_LOAN_BALANCE
  "600": "Swap fee percentage too high", // SWAP_FEE_PERCENTAGE_TOO_HIGH
  "601": "Flash loan fee percentage too high", // FLASH_LOAN_FEE_PERCENTAGE_TOO_HIGH
  "602": "Insufficient flash loan fee amount", // INSUFFICIENT_FLASH_LOAN_FEE_AMOUNT
};
