import FormData from "form-data";
import axios from "axios";
import { IIpfsClient } from "services/IpfsService";
import { Hash } from "services/EthereumService";

export class PinataIpfsClient implements IIpfsClient {

  private httpRequestConfig = {
    headers: {
      pinata_api_key: process.env.PINATA_SECRET_API_KEY,
      pinata_secret_api_key: process.env.PINATA_API_KEY,
    },
  };


  public async get(hash: Hash): Promise<string> {

    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, this.httpRequestConfig);

      if (response.status !== 200) {
        throw Error(`An error occurred getting the hash ${hash}: ${response.statusText}`);
      } else {
        const data = response.data;
        const result = await data.json();
        return result;
      }
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public async addAndPinData(data: string, name?: string): Promise<Hash> {
    const params = new FormData();
    const buffer = Buffer.from(data);
    params.append("file", buffer);
    if (name) {
      params.append("pinataMetadata", JSON.stringify({ name }));
    }

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", { body: params }, this.httpRequestConfig);

      if (response.status !== 200) {
        throw Error(`An error occurred adding these data to ipfs: ${response.statusText}`);
      } else {
        const data = response.data;
        const json = await data.json();
        return json.Hash;
      }
    } catch (ex) {
      throw new Error(ex);
    }
  }

  public async pinHash(hash: Hash, name?: string): Promise<void> {
    const params = new FormData();
    params.append("hashToPin", hash);
    if (name) {
      params.append("pinataMetadata", JSON.stringify({ name }));
    }

    try {
      const response = await axios.post("https://api.pinata.cloud/pinning/pinByHash", { body: params }, this.httpRequestConfig);

      if (response.status !== 200) {
        throw Error(`An error occurred pinning the file ${hash}: ${response.statusText}`);
      }
    } catch (ex) {
      throw new Error(ex);
    }
  }

  // private handleError(error) {
  //   if (error.response) {
  //     // The request was made and the server responded with a status code
  //     // that falls out of the range of 2xx
  //     console.log(error.response.data);
  //     console.log(error.response.status);
  //     console.log(error.response.headers);
  //   } else if (error.request) {
  //     // The request was made but no response was received
  //     // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
  //     // http.ClientRequest in node.js
  //     console.log(error.request);
  //   } else {
  //     // Something happened in setting up the request that triggered an Error
  //     console.log("Error", error.message);
  //   }
  //   console.log(error.config);
  // }
}
