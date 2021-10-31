// /* eslint-disable no-console */
// import { Address, EthereumService, fromWei, Hash, Networks } from "services/EthereumService";
// import { AddressZero, MaxUint256 } from "@ethersproject/constants";
// // import { BigNumber } from 'bignumber.js';
// // import { JsonRpcProvider } from '@ethersproject/providers';
// // import { Wallet } from '@ethersproject/wallet';
// // import { Contract } from '@ethersproject/contracts';
// // import { AddressZero, MaxUint256 } from '@ethersproject/constants';
// // import { SOR, SwapInfo, SwapTypes } from '../../src';
// // import vaultArtifact from '../../src/abi/Vault.json';
// // import relayerAbi from '../abi/BatchRelayer.json';
// // import erc20abi from '../abi/ERC20.json';

// import { SOR, SwapInfo, SwapTypes } from "@balancer-labs/sor";
// import { BigNumber, BigNumberish } from "ethers";
// import { ContractNames, ContractsService } from "services/ContractsService";

// const SUBGRAPH_URLS = {
//   [Networks.Mainnet]:
//         "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2",
//   [Networks.Rinkeby]:
//         "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-rinkeby-v2",
// };

// export class BalancerSorService {
//   private provider: any;

//   constructor(
//     private ethereumService: EthereumService,
//     private contractsService: ContractsService,
//   ) {
//     this.provider = this.ethereumService.readOnlyProvider;
//   }



//   async getSwapFromSor(
//     tokenIn: { symbol: string; address: string; decimals: number },
//     tokenOut: { symbol: string; address: string; decimals: number },
//     swapType = SwapTypes.SwapExactIn,
//     swapAmount: BigNumberish,
//   ): Promise<SwapInfo> {

//     const balancerSubgraphUrl = SUBGRAPH_URLS[this.ethereumService.targetedNetwork];

//     const sor = new SOR(this.provider, this.ethereumService.targetedChainId, balancerSubgraphUrl);

//     // Update pools list with most recent onchain balances
//     await sor.fetchPools([], true);

//     // gasPrice is used by SOR as a factor to determine how many pools to swap against.
//     // i.e. higher cost means more costly to trade against lots of different pools.
//     const gasPrice = BigNumber.from("40000000000");
//     // This determines the max no of pools the SOR will use to swap.
//     const maxPools = 4;

//     // This calculates the cost to make a swap which is used as an input to sor to allow it to make gas efficient recommendations.
//     // Note - tokenOut for SwapExactIn, tokenIn for SwapExactOut
//     const outputToken =
//         swapType === SwapTypes.SwapExactOut ? tokenIn : tokenOut;
//     const cost = await sor.getCostOfSwapInToken(
//       outputToken.address,
//       outputToken.decimals,
//       gasPrice,
//       BigNumber.from("35000"),
//     );
//     console.log(`getCostOfSwapInToken: ${cost.toString()}`);

//     const swapInfo: SwapInfo = await sor.getSwaps(
//       tokenIn.address,
//       tokenOut.address,
//       swapType,
//       swapAmount,
//       { gasPrice, maxPools },
//     );

//     const amtInScaled =
//         swapType === SwapTypes.SwapExactIn
//           ? fromWei(swapAmount, tokenIn.decimals)
//           : fromWei(swapInfo.returnAmount, tokenIn.decimals);
//     const amtOutScaled =
//         swapType === SwapTypes.SwapExactIn
//           ? fromWei(swapInfo.returnAmount, tokenOut.decimals)
//           : fromWei(swapAmount, tokenOut.decimals);

//     const returnDecimals =
//         swapType === SwapTypes.SwapExactIn
//           ? tokenOut.decimals
//           : tokenIn.decimals;

//     const returnWithFees = fromWei(
//       swapInfo.returnAmountConsideringFees,
//       returnDecimals,
//     );

//     const costToSwapScaled = fromWei(cost, returnDecimals);

//     const swapTypeStr =
//         swapType === SwapTypes.SwapExactIn ? "SwapExactIn" : "SwapExactOut";
//     console.log(swapTypeStr);
//     console.log(`Token In: ${tokenIn.symbol}, Amt: ${amtInScaled.toString()}`);
//     console.log(
//       `Token Out: ${tokenOut.symbol}, Amt: ${amtOutScaled.toString()}`,
//     );
//     console.log(`Cost to swap: ${costToSwapScaled.toString()}`);
//     console.log(`Return Considering Fees: ${returnWithFees.toString()}`);
//     console.log("Swaps:");
//     console.log(swapInfo.swaps);
//     console.log(swapInfo.tokenAddresses);

//     return swapInfo;
//   }

//   async makeTrade(
//     swapInfo: SwapInfo,
//     swapType = SwapTypes.SwapExactIn,
//   ): Promise<void> {
//     if (!swapInfo.returnAmount.gt(0)) {
//       console.log("Return Amount is 0. No swaps to execute.");
//       return;
//     }

//     if (swapInfo.tokenIn !== AddressZero) {
//       // Vault needs approval for swapping non ETH
//       console.log("Checking vault allowance...");

//       const tokenInContract = this.contractsService.getContractAtAddress(ContractNames.ERC20, swapInfo.tokenIn);

//       let allowance = await tokenInContract.allowance(
//         this.ethereumService.defaultAccountAddress,
//         vaultAddr,
//       );

//       if (allowance.lt(swapInfo.swapAmount)) {
//         console.log(
//           `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`,
//         );
//         const txApprove = await tokenInContract
//           .approve(vaultAddr, MaxUint256);
//         await txApprove.wait();
//         console.log(`Allowance updated: ${txApprove.hash}`);
//         allowance = await tokenInContract.allowance(
//           this.ethereumService.defaultAccountAddress,
//           vaultAddr,
//         );
//       }

//       console.log(`Allowance: ${allowance.toString()}`);
//     }

//     const vaultContract = this.contractsService.getContractAtAddress(ContractNames.VAULT, vaultAddr);

//     type FundManagement = {
//       sender: string;
//       recipient: string;
//       fromInternalBalance: boolean;
//       toInternalBalance: boolean;
//     };

//     const funds: FundManagement = {
//       sender: this.ethereumService.defaultAccountAddress,
//       recipient: this.ethereumService.defaultAccountAddress,
//       fromInternalBalance: false,
//       toInternalBalance: false,
//     };

//     // Limits:
//     // +ve means max to send
//     // -ve mean min to receive
//     // For a multihop the intermediate tokens should be 0
//     // This is where slippage tolerance would be added
//     const limits: string[] = [];
//     if (swapType === SwapTypes.SwapExactIn) {
//       swapInfo.tokenAddresses.forEach((token, i) => {
//         if (token.toLowerCase() === swapInfo.tokenIn.toLowerCase()) {
//           limits[i] = swapInfo.swapAmount.toString();
//         } else if (
//           token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
//         ) {
//           limits[i] = swapInfo.returnAmount
//             .mul(-0.99)
//             .toString()
//             .split(".")[0];
//         } else {
//           limits[i] = "0";
//         }
//       });
//     } else {
//       swapInfo.tokenAddresses.forEach((token, i) => {
//         if (token.toLowerCase() === swapInfo.tokenIn.toLowerCase()) {
//           limits[i] = swapInfo.returnAmount.toString();
//         } else if (
//           token.toLowerCase() === swapInfo.tokenOut.toLowerCase()
//         ) {
//           limits[i] = swapInfo.swapAmount
//             .mul(-0.99)
//             .toString()
//             .split(".")[0];
//         } else {
//           limits[i] = "0";
//         }
//       });
//     }
//     const deadline = Vault.deadline;

//     console.log(funds);
//     console.log(swapInfo.tokenAddresses);
//     console.log(limits);

//     console.log("Swapping...");

//     const overRides = {};
//     // overRides['gasLimit'] = '200000';
//     // overRides['gasPrice'] = '20000000000';
//     // ETH in swaps must send ETH value
//     if (swapInfo.tokenIn === AddressZero) {
//       overRides["value"] = swapInfo.swapAmount.toString();
//     }

//     const tx = await vaultContract
//       .batchSwap(
//         swapType,
//         swapInfo.swaps,
//         swapInfo.tokenAddresses,
//         funds,
//         limits,
//         deadline,
//         overRides,
//       );

//     console.log(`tx: ${tx.hash}`);
//   }

//   /**
//    * note required I guess unless one of the tokens is STETH
//    */
//   // async makeRelayerTrade(
//   //   swapInfo: SwapInfo,
//   //   swapType: SwapTypes,
//   // ): Promise<void> {

//   //   if (!swapInfo.returnAmount.gt(0)) {
//   //     console.log("Return Amount is 0. No swaps to exectute.");
//   //     return;
//   //   }
//   //   const wallet = this.ethereumService.walletProvider;

//   //   if (swapInfo.tokenIn !== AddressZero) {
//   //     // Vault needs approval for swapping non ETH
//   //     console.log("Checking vault allowance...");
//   //     const tokenInContract = this.contractsService.getContractAtAddress(ContractNames.ERC20, swapInfo.tokenIn);

//   //     let allowance = await tokenInContract.allowance(
//   //       this.ethereumService.defaultAccountAddress,
//   //       vaultAddr,
//   //     );
//   //     if (allowance.lt(swapInfo.swapAmount)) {
//   //       console.log(
//   //         `Not Enough Allowance: ${allowance.toString()}. Approving vault now...`,
//   //       );
//   //       const txApprove = await tokenInContract
//   //         .approve(vaultAddr, MaxUint256);
//   //       await txApprove.wait();
//   //       console.log(`Allowance updated: ${txApprove.hash}`);
//   //       allowance = await tokenInContract.allowance(
//   //         this.ethereumService.defaultAccountAddress,
//   //         vaultAddr,
//   //       );
//   //     }

//   //     console.log(`Allowance: ${allowance.toString()}`);
//   //   }

//   //   const relayerContract = new Contract(
//   //     ADDRESSES[chainId].BatchRelayer.address,
//   //     relayerAbi,
//   //     this.provider,
//   //   );
//   //   relayerContract.connect(wallet);

//   //   type FundManagement = {
//   //     sender: string;
//   //     recipient: string;
//   //     fromInternalBalance: boolean;
//   //     toInternalBalance: boolean;
//   //   };

//   //   const funds: FundManagement = {
//   //     sender: this.ethereumService.defaultAccountAddress,
//   //     recipient: this.ethereumService.defaultAccountAddress,
//   //     fromInternalBalance: false,
//   //     toInternalBalance: false,
//   //   };

//   //   let tokenIn = swapInfo.tokenIn;
//   //   let tokenOut = swapInfo.tokenOut;
//   //   if (swapInfo.tokenIn === ADDRESSES[chainId].STETH.address) {
//   //     tokenIn = ADDRESSES[chainId].wSTETH.address;
//   //   }
//   //   if (swapInfo.tokenOut === ADDRESSES[chainId].STETH.address) {
//   //     tokenOut = ADDRESSES[chainId].wSTETH.address;
//   //   }

//   //   // Limits:
//   //   // +ve means max to send
//   //   // -ve mean min to receive
//   //   // For a multihop the intermediate tokens should be 0
//   //   // This is where slippage tolerance would be added
//   //   const limits: string[] = [];
//   //   if (swapType === SwapTypes.SwapExactIn) {
//   //     swapInfo.tokenAddresses.forEach((token, i) => {
//   //       if (token.toLowerCase() === tokenIn.toLowerCase()) {
//   //         if (!swapInfo.swapAmountForSwaps) return;
//   //         limits[i] = swapInfo.swapAmountForSwaps.toString();
//   //       } else if (token.toLowerCase() === tokenOut.toLowerCase()) {
//   //         if (!swapInfo.returnAmountFromSwaps) return;
//   //         limits[i] = swapInfo.returnAmountFromSwaps
//   //           .mul(-0.99)
//   //           .toString()
//   //           .split(".")[0];
//   //       } else {
//   //         limits[i] = "0";
//   //       }
//   //     });
//   //   } else {
//   //     swapInfo.tokenAddresses.forEach((token, i) => {
//   //       if (token.toLowerCase() === tokenIn.toLowerCase()) {
//   //         if (!swapInfo.returnAmountFromSwaps) return;
//   //         limits[i] = swapInfo.returnAmountFromSwaps
//   //           .mul(1.001)
//   //           .toString()
//   //           .split(".")[0];
//   //         // limits[i] = swapInfo.returnAmountFromSwaps?.toString(); // No buffer
//   //       } else if (token.toLowerCase() === tokenOut.toLowerCase()) {
//   //         if (!swapInfo.swapAmountForSwaps) return;
//   //         limits[i] = swapInfo.swapAmountForSwaps.mul(-1).toString();
//   //       } else {
//   //         limits[i] = "0";
//   //       }
//   //     });
//   //   }
//   //   const deadline = MaxUint256;

//   //   console.log(funds);
//   //   console.log(swapInfo.tokenAddresses);
//   //   console.log(limits);

//   //   console.log("Swapping...");

//   //   const overRides = {};
//   //   overRides["gasLimit"] = "450000";
//   //   overRides["gasPrice"] = "20000000000";
//   //   // ETH in swaps must send ETH value
//   //   if (swapInfo.tokenIn === AddressZero) {
//   //     overRides["value"] = swapInfo.swapAmountForSwaps?.toString();
//   //   }

//   //   if (swapInfo.swaps.length === 1) {
//   //     console.log("SINGLE SWAP");
//   //     const single = {
//   //       poolId: swapInfo.swaps[0].poolId,
//   //       kind: swapType,
//   //       assetIn: swapInfo.tokenAddresses[swapInfo.swaps[0].assetInIndex],
//   //       assetOut: swapInfo.tokenAddresses[swapInfo.swaps[0].assetOutIndex],
//   //       amount: swapInfo.swaps[0].amount,
//   //       userData: swapInfo.swaps[0].userData,
//   //     };

//   //     if (!swapInfo.returnAmountFromSwaps) return;

//   //     let limit = swapInfo.returnAmountFromSwaps.mul(1.01).toString(); // Max In
//   //     if (swapType === SwapTypes.SwapExactIn)
//   //       limit = swapInfo.returnAmountFromSwaps.mul(0.99).toString(); // Min return

//   //     const tx = await relayerContract
//   //       .callStatic.swap(single, funds, limit, deadline, overRides);
//   //     console.log(tx.toString());
//   //     console.log(swapInfo.returnAmountFromSwaps.mul(1.01).toString());
//   //   } else {
//   //     const tx = await relayerContract
//   //       .connect(wallet)
//   //       .batchSwap(
//   //         swapType,
//   //         swapInfo.swaps,
//   //         swapInfo.tokenAddresses,
//   //         funds,
//   //         limits,
//   //         deadline,
//   //         overRides,
//   //       );
//   //     console.log("tx:");
//   //     console.log(tx);
//   //   }
//   // }

//   /**
//    * example of usage
//    */
//   // async simpleSwap(
//   //   tokenIn: ITokenInfo,
//   //   tokenOut: ITokenInfo,
//   // ): Promise<void> {
//   //   const networkId = this.ethereumService.targetedNetwork;
//   //   // const networkId = Network.KOVAN;
//   //   // Pools source can be Subgraph URL or pools data set passed directly
//   //   const poolsSource = SUBGRAPH_URLS[networkId];
//   //   // const poolsSource = require('../testData/testPools/gusdBug.json');
//   //   // Update pools list with most recent onchain balances
//   //   const queryOnChain = true;
//   //   const swapType = SwapTypes.SwapExactIn;
//   //   const swapAmount = toWei("0.07", 18); // In normalized format, i.e. 1USDC = 1
//   //   const executeTrade = false;

//   //   // This can be useful for debug
//   //   // Fetch & print list of pools from Subgraph
//   //   // let subgraphPools = await fetchSubgraphPools(SUBGRAPH_URLS[networkId]);
//   //   // console.log(`-------`)
//   //   // console.log(JSON.stringify(subgraphPools));
//   //   // console.log(`-------`);

//   //   const swapInfo = await this.getSwap(
//   //     poolsSource,
//   //     queryOnChain,
//   //     tokenIn,
//   //     tokenOut,
//   //     swapType,
//   //     swapAmount,
//   //   );

//   //   if (executeTrade) {
//   //     console.log("VAULT SWAP");
//   //     await this.makeTrade(swapInfo, swapType);
//   //   }
//   // }
// }
