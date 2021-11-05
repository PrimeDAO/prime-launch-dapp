import { Container } from "aurelia-dependency-injection";
import { Address, fromWei } from "./../services/EthereumService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { autoinject } from "aurelia-framework";
import { NumberService } from "services/NumberService";
import { Vault } from "entities/Vault";
import { BigNumber } from "ethers";

@autoinject
export class Lbp {

  public contract: any;
  public address: Address;
  public vault: Vault;
  public projectTokenWeight: number;
  public fundingTokenWeight: number;
  public poolId;

  private projectTokenIndex: any;
  private fundingTokenIndex: number;

  constructor(
    private contractsService: ContractsService,
    private numberService: NumberService,
    private container: Container,
  ) {
  }

  public async initialize(address: Address,
    projectTokenIndex: number,
    fundingTokenIndex: number): Promise<Lbp> {

    this.address = address;
    this.projectTokenIndex = projectTokenIndex;
    this.fundingTokenIndex = fundingTokenIndex;

    await this.loadContracts();

    await this.hydrate();

    return this;
  }

  private createVault(address: Address): Promise<Vault> {
    if (address) {
      const vault = this.container.get(Vault);
      return vault.initialize(
        this.poolId,
        this.projectTokenIndex,
        this.fundingTokenIndex);
    } else {
      return undefined;
    }
  }

  public async hydrate(): Promise<void> {
    this.poolId = await this.contract.getPoolId();
    this.vault = await this.createVault(await this.contract.getVault());
    const weights = await this.contract.getNormalizedWeights();
    this.projectTokenWeight = this.numberService.fromString(fromWei(weights[this.projectTokenIndex]));
    this.fundingTokenWeight = this.numberService.fromString(fromWei(weights[this.fundingTokenIndex]));
  }

  public async loadContracts(): Promise<void> {
    this.contract = await this.contractsService.getContractAtAddress(ContractNames.LBP, this.address);
    if (this.vault) {
      this.vault.loadContracts();
    }
  }

  public balanceOfPoolTokens(address: Address): Promise<BigNumber> {
    return this.contract.balanceOf(address);
  }
}
