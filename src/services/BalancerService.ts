import { ContractNames, ContractsService } from "services/ContractsService";
/* eslint-disable no-console */
import { SOR, SwapInfo, SwapTypes } from "@balancer-labs/sor";
import { AddressZero } from "@ethersproject/constants";
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

  public initialize(): Promise<void> {
    try {
      const balancerSubgraphUrl = SUBGRAPH_URLS[this.ethereumService.targetedNetwork];
      this.SOR = new SOR(this.ethereumService.readOnlyProvider as any, this.ethereumService.targetedChainId, balancerSubgraphUrl);
      // Update pools list with most recent onchain balances
      return this.SOR.fetchPools([], true);
    } catch (ex) {
      this.SOR = undefined;
      this.consoleLogService.logMessage(`Failed to initialize SOR: ${Utils.extractExceptionMessage(ex)}`, "error");
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
        } else if (
          token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
        ) {
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
        } else if (
          token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
        ) {
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
        BalancerService.Deadline(),
        overRides,
      );

    console.log(`tx: ${tx.hash}`);

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
}

const balancerErrorCodes: Record<string, string> = {
  "000": "ADD_OVERFLOW",
  "001": "SUB_OVERFLOW",
  "002": "SUB_UNDERFLOW",
  "003": "MUL_OVERFLOW",
  "004": "ZERO_DIVISION",
  "005": "DIV_INTERNAL",
  "006": "X_OUT_OF_BOUNDS",
  "007": "Y_OUT_OF_BOUNDS",
  "008": "PRODUCT_OUT_OF_BOUNDS",
  "009": "INVALID_EXPONENT",
  "100": "OUT_OF_BOUNDS",
  "101": "UNSORTED_ARRAY",
  "102": "UNSORTED_TOKENS",
  "103": "INPUT_LENGTH_MISMATCH",
  "104": "ZERO_TOKEN",
  "200": "MIN_TOKENS",
  "201": "MAX_TOKENS",
  "202": "MAX_SWAP_FEE_PERCENTAGE",
  "203": "MIN_SWAP_FEE_PERCENTAGE",
  "204": "MINIMUM_BPT",
  "205": "CALLER_NOT_VAULT",
  "206": "UNINITIALIZED",
  "207": "BPT_IN_MAX_AMOUNT",
  "208": "BPT_OUT_MIN_AMOUNT",
  "209": "EXPIRED_PERMIT",
  "210": "NOT_TWO_TOKENS",
  "300": "MIN_AMP",
  "301": "MAX_AMP",
  "302": "MIN_WEIGHT",
  "303": "MAX_STABLE_TOKENS",
  "304": "MAX_IN_RATIO",
  "305": "MAX_OUT_RATIO",
  "306": "MIN_BPT_IN_FOR_TOKEN_OUT",
  "307": "MAX_OUT_BPT_FOR_TOKEN_IN",
  "308": "NORMALIZED_WEIGHT_INVARIANT",
  "309": "INVALID_TOKEN",
  "310": "UNHANDLED_JOIN_KIND",
  "311": "ZERO_INVARIANT",
  "312": "ORACLE_INVALID_SECONDS_QUERY",
  "313": "ORACLE_NOT_INITIALIZED",
  "314": "ORACLE_QUERY_TOO_OLD",
  "315": "ORACLE_INVALID_INDEX",
  "316": "ORACLE_BAD_SECS",
  "317": "AMP_END_TIME_TOO_CLOSE",
  "318": "AMP_ONGOING_UPDATE",
  "319": "AMP_RATE_TOO_HIGH",
  "320": "AMP_NO_ONGOING_UPDATE",
  "321": "STABLE_INVARIANT_DIDNT_CONVERGE",
  "322": "STABLE_GET_BALANCE_DIDNT_CONVERGE",
  "323": "RELAYER_NOT_CONTRACT",
  "324": "BASE_POOL_RELAYER_NOT_CALLED",
  "325": "REBALANCING_RELAYER_REENTERED",
  "326": "GRADUAL_UPDATE_TIME_TRAVEL",
  "327": "SWAPS_DISABLED",
  "328": "CALLER_IS_NOT_LBP_OWNER",
  "329": "PRICE_RATE_OVERFLOW",
  "330": "INVALID_JOIN_EXIT_KIND_WHILE_SWAPS_DISABLED",
  "331": "WEIGHT_CHANGE_TOO_FAST",
  "332": "LOWER_GREATER_THAN_UPPER_TARGET",
  "333": "UPPER_TARGET_TOO_HIGH",
  "334": "UNHANDLED_BY_LINEAR_POOL",
  "335": "OUT_OF_TARGET_RANGE",
  "336": "UNHANDLED_EXIT_KIND ",
  "337": "UNAUTHORIZED_EXIT",
  "338": "MAX_MANAGEMENT_SWAP_FEE_PERCENTAGE",
  "339": "UNHANDLED_BY_MANAGED_POOL",
  "340": "UNHANDLED_BY_PHANTOM_POOL",
  "341": "TOKEN_DOES_NOT_HAVE_RATE_PROVIDER",
  "342": "INVALID_INITIALIZATION",
  "400": "REENTRANCY",
  "401": "SENDER_NOT_ALLOWED",
  "402": "PAUSED",
  "403": "PAUSE_WINDOW_EXPIRED",
  "404": "MAX_PAUSE_WINDOW_DURATION",
  "405": "MAX_BUFFER_PERIOD_DURATION",
  "406": "INSUFFICIENT_BALANCE",
  "407": "INSUFFICIENT_ALLOWANCE",
  "408": "ERC20_TRANSFER_FROM_ZERO_ADDRESS",
  "409": "ERC20_TRANSFER_TO_ZERO_ADDRESS",
  "410": "ERC20_MINT_TO_ZERO_ADDRESS",
  "411": "ERC20_BURN_FROM_ZERO_ADDRESS",
  "412": "ERC20_APPROVE_FROM_ZERO_ADDRESS",
  "413": "ERC20_APPROVE_TO_ZERO_ADDRESS",
  "414": "ERC20_TRANSFER_EXCEEDS_ALLOWANCE",
  "415": "ERC20_DECREASED_ALLOWANCE_BELOW_ZERO",
  "416": "ERC20_TRANSFER_EXCEEDS_BALANCE",
  "417": "ERC20_BURN_EXCEEDS_ALLOWANCE",
  "418": "SAFE_ERC20_CALL_FAILED",
  "419": "ADDRESS_INSUFFICIENT_BALANCE",
  "420": "ADDRESS_CANNOT_SEND_VALUE",
  "421": "SAFE_CAST_VALUE_CANT_FIT_INT256",
  "422": "GRANT_SENDER_NOT_ADMIN",
  "423": "REVOKE_SENDER_NOT_ADMIN",
  "424": "RENOUNCE_SENDER_NOT_ALLOWED",
  "425": "BUFFER_PERIOD_EXPIRED",
  "426": "CALLER_IS_NOT_OWNER",
  "427": "NEW_OWNER_IS_ZERO",
  "428": "CODE_DEPLOYMENT_FAILED",
  "429": "CALL_TO_NON_CONTRACT",
  "430": "LOW_LEVEL_CALL_FAILED",
  "431": "NOT_PAUSED",
  "500": "INVALID_POOL_ID",
  "501": "CALLER_NOT_POOL",
  "502": "SENDER_NOT_ASSET_MANAGER",
  "503": "USER_DOESNT_ALLOW_RELAYER",
  "504": "INVALID_SIGNATURE",
  "505": "EXIT_BELOW_MIN",
  "506": "JOIN_ABOVE_MAX",
  "507": "SWAP_LIMIT",
  "508": "SWAP_DEADLINE",
  "509": "CANNOT_SWAP_SAME_TOKEN",
  "510": "UNKNOWN_AMOUNT_IN_FIRST_SWAP",
  "511": "MALCONSTRUCTED_MULTIHOP_SWAP",
  "512": "INTERNAL_BALANCE_OVERFLOW",
  "513": "INSUFFICIENT_INTERNAL_BALANCE",
  "514": "INVALID_ETH_INTERNAL_BALANCE",
  "515": "INVALID_POST_LOAN_BALANCE",
  "516": "INSUFFICIENT_ETH",
  "517": "UNALLOCATED_ETH",
  "518": "ETH_TRANSFER",
  "519": "CANNOT_USE_ETH_SENTINEL",
  "520": "TOKENS_MISMATCH",
  "521": "TOKEN_NOT_REGISTERED",
  "522": "TOKEN_ALREADY_REGISTERED",
  "523": "TOKENS_ALREADY_SET",
  "524": "TOKENS_LENGTH_MUST_BE_2",
  "525": "NONZERO_TOKEN_BALANCE",
  "526": "BALANCE_TOTAL_OVERFLOW",
  "527": "POOL_NO_TOKENS",
  "528": "INSUFFICIENT_FLASH_LOAN_BALANCE",
  "600": "SWAP_FEE_PERCENTAGE_TOO_HIGH",
  "601": "FLASH_LOAN_FEE_PERCENTAGE_TOO_HIGH",
  "602": "INSUFFICIENT_FLASH_LOAN_FEE_AMOUNT",
};
