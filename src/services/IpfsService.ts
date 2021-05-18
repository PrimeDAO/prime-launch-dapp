import { Hash } from "services/EthereumService";

export interface IIpfsClient {
  get(hash: Hash): Promise<string>;
  pinHash(hash: Hash, name?: string): Promise<void>;
  addAndPinData(data: string, name?: string): Promise<Hash>;
}

export interface IAlchemyProposalParams {
  title: string;
  url ?: string;
  description: string;
  tags ?: string[];
}

export class IpfsService {
  /**
   * must be initialize externally prior to using the service
   */
  private ipfs: IIpfsClient;

  public initialize(ipfs: IIpfsClient): void {
    this.ipfs = ipfs;
  }

  /**
 * save data of an Alchemy proposal to IPFS, return the IPFS hash
 * @param  options an Object to save. This object must have title, url and description defined
 * @return  a Promise that resolves in the IPFS Hash where the file is saved
 */
  public saveAlchemyProposalDescription(options: IAlchemyProposalParams): Promise<Hash> {
    let ipfsDataToSave = {};
    if (options.title || options.url || options.description || options.tags !== undefined) {
      ipfsDataToSave = {
        description: options.description,
        tags: options.tags,
        title: options.title,
        url: options.url,
      };
    }
    return this.ipfs.addAndPinData(JSON.stringify(ipfsDataToSave));
  }

  /**
   * fetches JSON data given hash, converts to an object
   * @param hash
   * @returns
   */
  public async getObjectFromHash(hash: Hash) : Promise<any> {
    return JSON.parse(await this.ipfs.get(hash));
  }

  /**
   * saves and pin the given data
   * @param str
   * @returns the resulting hash
   */
  public async saveString(str: string, name?: string): Promise<Hash> {
    return this.ipfs.addAndPinData(str, name);
  }
}
