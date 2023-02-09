import { autoinject } from "aurelia-framework";
import { EthereumService, Hash, isMainnet } from "services/EthereumService";
import axios from "axios";
import { ConsoleLogService } from "services/ConsoleLogService";
const CID = require("cids");

export interface IIpfsClient {
  pinHash(hash: Hash, name?: string): Promise<void>;
  addAndPinData(data: string, name?: string): Promise<Hash>;
}

export interface IAlchemyProposalParams {
  title: string;
  url ?: string;
  description: string;
  tags ?: string[];
}

@autoinject
export class IpfsService {

  constructor(private consoleLogService: ConsoleLogService) {}

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
   * @param protocol -- ipfs or ipns
   * @returns
   */
  public async getObjectFromHash(hash: Hash, protocol = "ipfs") : Promise<any> {
    let url = "n/a";
    try {
      url = this.getIpfsUrl(hash, protocol);
      const response = await axios.get(url);

      if (response.status !== 200) {
        throw Error(`An error occurred getting the hash ${hash}: ${response.statusText}`);
      } else {
        return (typeof response.data === "string") ? JSON.parse(response.data) : response.data;
      }
    } catch (ex) {
      this.consoleLogService.logMessage(`Error fetching from ${url}: ${ex.message}`, "error");
      return null;
    }
  }

  /**
   * saves and pin the given data
   * @param str
   * @returns the resulting hash
   */
  public async saveString(str: string, name?: string): Promise<Hash> {
    return this.ipfs.addAndPinData(str, name);
  }

  /**
   * url to use to request content from IPFS or IPNS
   * @param hash IPFS hash or IPNS name
   * @returns
   */
  public getIpfsUrl(hash: string, protocol= "ipfs"): string {
    let format;
    if (isMainnet(EthereumService.targetedNetwork)) {
      format = process.env.IPFS_GATEWAY;
    } else {
      format = process.env.IPFS_GATEWAY_DEV;
    }
    // const encodedHash = (protocol === "ipfs") ? new CID(hash).toV1().toBaseEncodedString("base32") : hash;
    const encodedHash = (protocol === "ipfs") ? new CID(hash).toV0().toBaseEncodedString() : hash;
    return format.replace("${hash}", encodedHash).replace("${protocol}", protocol);
  }
}
