import { autoinject } from "aurelia-framework";
import { Address, EthereumService } from "services/EthereumService";

@autoinject
export class EnsService {

  /**
   * cache Address => ENS
   */
  private ensCache = new Map<Address, string>();
  /**
   * cache ENS => Address
   */
  private addressCache = new Map<string, Address>();

  constructor(
    private ethereumService: EthereumService,
  ) {}

  /**
   * Gets an ENS for the given address.
   * @param address
   * @returns null if there is no ENS
   */
  public async getEnsForAddress(address: Address): Promise<string> {
    let ens: string;
    let isCached = false;

    if (!address?.trim().length) {
      return address;
    }

    if (this.ensCache.has(address)) {
      isCached = true;
      ens = this.ensCache.get(address);
    }

    if (!isCached && !ens) {
      ens = await this.ethereumService.getEnsForAddress(address);
      this.ensCache.set(address, ens);
      this.addressCache.set(ens, address);
    }
    return ens;
  }

  /**
   * Returns address for the given ENS.
   * Returns null if it can't resolve the ENS to an address
   * Returns address if it already is one.
   */
  public async getAddressForEns(ens: string): Promise<Address> {
    let address: Address;
    let isCached = false;

    if (!ens?.trim().length) {
      return ens;
    }

    if (this.addressCache.has(ens)) {
      isCached = true;
      address = this.addressCache.get(ens);
    }

    if (!isCached && !address) {
      address = await this.ethereumService.getAddressForEns(ens);
      this.addressCache.set(ens, address);
      this.ensCache.set(address, ens);
    }

    return address;
  }
}
