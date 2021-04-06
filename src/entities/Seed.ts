import { DateService } from "./../services/DateService";
import { ContractsService, ContractNames } from "./../services/ContractsService";
import { BigNumber } from "ethers";
import { Address } from "services/EthereumService";

export interface ISeedConfiguration {
  address: Address;
  beneficiary: Address;
}

export class Seed {
  contract: any;
  address: Address;
  beneficiary: Address;
  startTime: Date;
  endTime: Date;
  price: BigNumber;
  minSuccess: BigNumber;
  cap: BigNumber;
  seedToken: Address;
  fundingToken: Address;

  constructor(
    private contractsService: ContractsService,
    private dateService: DateService,
  ) {}

  public async initialize(config: ISeedConfiguration): Promise<Seed> {
    Object.assign(this, config);

    this.contract = await this.contractsService.getContractAtAddress(ContractNames.SEED, this.address);

    this.startTime = this.dateService.unixEpochToDate(await this.contract.startTime());
    this.endTime = this.dateService.unixEpochToDate(await this.contract.endTime());
    this.price = await this.contract.price();
    const successMinimumAndCap = await this.contract.successMinimumAndCap();
    this.minSuccess = successMinimumAndCap[0];
    this.cap = successMinimumAndCap[1];
    this.seedToken = await this.contract.seedToken();
    this.fundingToken = await this.contract.fundingToken();

    return this;
  }
}
