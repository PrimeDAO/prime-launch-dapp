import { Address, fromWei } from "services/EthereumService";
import { Container } from "aurelia-dependency-injection";
import { ContractNames, ContractsService } from "services/ContractsService";
import { autoinject } from "aurelia-framework";
import { NumberService } from "services/NumberService";
import { Vault } from "entities/Vault";
import { BigNumber } from "ethers";
import { MultiCallService } from "services/MulticallService";

@autoinject
export class Lbp {

  public contract: any;
  public address: Address;
  public vault: Vault;
  public projectTokenWeight: number;
  public poolId: string;
  public lbpManagerAddress: Address;
  public poolTokenBalance: any;

  private projectTokenIndex: any;
  private fundingTokenIndex: number;
  private lbpAdminAddress: Address;

  constructor(
    private contractsService: ContractsService,
    private numberService: NumberService,
    private container: Container,
    private multiCallService: MultiCallService,
  ) {
  }

  public async initialize(
    address: Address,
    lbpManagerAddress: Address,
    lbpAdminAddress: Address,
    projectTokenIndex: number,
    fundingTokenIndex: number): Promise<Lbp> {

    this.address = address;
    this.lbpManagerAddress = lbpManagerAddress;
    this.lbpAdminAddress = lbpAdminAddress;
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
        this.lbpAdminAddress,
        this.poolId,
        this.projectTokenIndex,
        this.fundingTokenIndex);
    } else {
      return undefined;
    }
  }

  public async hydrate(): Promise<void> {
    let vaultAddress: Address;
    let weights: Array<BigNumber>;

    const batcher = this.multiCallService.createBatcher([
      {
        contractAddress: this.contract.address,
        functionName: "getPoolId",
        returnType: "bytes32",
        resultHandler: (result) => { this.poolId = result; },
      },
      {
        contractAddress: this.contract.address,
        functionName: "getVault",
        returnType: "address",
        resultHandler: (result) => { vaultAddress = result; },
      },
      {
        contractAddress: this.contract.address,
        functionName: "getNormalizedWeights",
        returnType: "uint256[]",
        resultHandler: (result) => { weights = result; },
      },
      {
        contractAddress: this.contract.address,
        functionName: "balanceOf",
        paramTypes: ["address"],
        paramValues: [this.lbpManagerAddress],
        returnType: "uint256",
        resultHandler: (result) => { this.poolTokenBalance = result; },
      },
    ]);

    await batcher.start();

    this.projectTokenWeight = this.numberService.fromString(fromWei(weights[this.projectTokenIndex]));
    this.vault = await this.createVault(vaultAddress);
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
