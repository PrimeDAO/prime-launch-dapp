import axios from "axios";

export class GeoBlockService {
  private blacklist = new Set<string>([
    "CU",
    "IR",
    "SY",
    "KP",
    "US",
    "UM",
    "AF",
    "ET",
    "GY",
    "IQ",
    "SD",
    "YE",
    "VE",
  ]);

  public async initialize(): Promise<void> {
    // this.blackisted = !this.blacklist.has(await this.getCountry());
  }

  private getCountry(): Promise<string> {
    // 0d88a37a243d8d0c9b7795eb5dfd40ad
    return axios.get(`http://api.ipstack.com/check?access_key=${process.env.IPSTACK_API_KEY}`)
      .then((response) => {
        return response.data.country_code;
      });
  }

  public blackisted: boolean;
}
