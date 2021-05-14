import { Hash } from "services/EthereumService";

export interface IIpfsClient {
  get(hash: Hash): Promise<string>;
  pinHash(hash: Hash): Promise<void>;
  addAndPinData(data: string): Promise<Hash>;
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
  public ipfs: IIpfsClient;

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
}
