import { autoinject } from "aurelia-framework";
import { EthereumService } from "./EthereumService";
import axios from "axios";
import { IIpfsClient } from "services/IpfsService";
import { Hash } from "services/EthereumService";

@autoinject
export class PinataIpfsClient implements IIpfsClient {

  private httpRequestConfig;

  constructor(ethereumService: EthereumService) {
    this.httpRequestConfig = {
      headers: {
        pinata_api_key:
        (ethereumService.targetedNetwork === "mainnet") ? process.env.PINATA_API_KEY : process.env.PINATA_API_KEY_TEST,
        pinata_secret_api_key:
        (ethereumService.targetedNetwork === "mainnet") ? process.env.PINATA_SECRET_API_KEY : process.env.PINATA_SECRET_API_KEY_TEST,
      },
    };
  }

  public async addAndPinData(data: string, name?: string): Promise<Hash> {
    const body = {
      pinataContent: data,
    };

    if (name) {
      body["pinataMetadata"] = JSON.stringify({ name });
    }

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", body, this.httpRequestConfig);

      if (response.status !== 200) {
        throw Error(`An error occurred adding these data to ipfs: ${response.statusText}`);
      } else {
        return response.data.IpfsHash;
      }
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public async pinHash(hash: Hash, name?: string): Promise<void> {
    const body = {
      hashToPin: hash,
    };

    if (name) {
      body["pinataMetadata"] = JSON.stringify({ name });
    }

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinByHash", body, this.httpRequestConfig);

      if (response.status !== 200) {
        throw Error(`An error occurred pinning the file ${hash}: ${response.statusText}`);
      }
    } catch (ex) {
      throw new Error(ex);
    }
  }
}
