import { TransactionReceipt } from "@ethersproject/providers";
import { ContractNames, ContractsService } from "./ContractsService";
import { autoinject } from "aurelia-framework";
import { Address } from "services/EthereumService";
import TransactionsService from "services/TransactionsService";
import { BigNumber } from "ethers";

// export interface ISeed {
//   address: Address;
//   description: string;
//   /**
//    * SVG icon for the pool
//    */
//   icon: string;
//   name: string;
//   /**
//    * the pool doesn't actually exist yet, but we want to present a preview in the UI
//    */
//   preview: boolean;
//   story: string;
// }

/**
 * see SeedFactory contract for docs of these params
 */
export interface IDeploySeedParams {
  admin: Address;
  seedToken: Address;
  fundingToken: Address;
  successMinimumAndCap: Array<BigNumber>;
  fee: BigNumber;
  price: BigNumber;
  startTime: number;
  endTime: number;
  vestingDuration: number;
  vestingCliff: number;
  isWhitelisted: boolean;
}
@autoinject
export class SeedService {

  constructor(
    private contractsService: ContractsService,
    private transactionsService: TransactionsService,
  ) {

  }

  public async deploySeed(params: IDeploySeedParams): Promise<TransactionReceipt> {
    const factoryContract = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);

    return this.transactionsService.send(factoryContract.deploySeed(
      params.admin,
      params.seedToken,
      params.fundingToken,
      params.successMinimumAndCap,
      params.price,
      params.startTime,
      params.endTime,
      params.vestingDuration,
      params.vestingCliff,
      params.isWhitelisted,
      params.fee,
    ));
  }
}
