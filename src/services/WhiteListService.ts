import { EthereumService } from "./EthereumService";
/* eslint-disable require-atomic-updates */
import { autoinject } from "aurelia-framework";
import { ConsoleLogService } from "services/ConsoleLogService";
import axios from "axios";
import { Address } from "services/EthereumService";

@autoinject
export class WhiteListService {

  constructor(
    private consoleLogService: ConsoleLogService,
    private ethereumService: EthereumService) {}

  private lists = new Map<string, Set<Address>>();

  public async getWhiteList(url: string): Promise<Set<Address>> {
    let list = this.lists.get(url);
    /**
     * note that the list can be null if it wasn't able to be obtained on a previous try
     */
    if (list === undefined) {
      list = await axios.get(url)
        .then((response) => {
          if (response.data) {
            /**
             * pulls all unique and valid addresses out of the file.  Ignores invalid addresses.
             */
            list = new Set(Array.from(response.data.matchAll(/(0x[a-zA-Z0-9]{40})\W?/g)).map(r => r[1]));
            this.consoleLogService.logMessage(`getWhiteList: found whitelist containing ${list.size} addresses at ${url}`, "info");
            this.lists.set(url, list);
            return list;
          } else {
            this.consoleLogService.logMessage("getWhiteList: something went wrong", "error");
            this.lists.set(url, null);
            return null;
          }
        })
        .catch((error) => {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            this.consoleLogService.logMessage(error.response.data, "error");
            this.consoleLogService.logMessage(error.response.status, "error");
            this.consoleLogService.logMessage(error.response.headers, "error");
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            this.consoleLogService.logMessage(error.request, "error");
          } else {
            // Something happened in setting up the request that triggered an Error
            this.consoleLogService.logMessage(error.message, "error");
          }
          this.lists.set(url, null);
          return null;
        });
    }
    return list;
  }

  /**
   * @param url the location of the file containing a list of addresses (see getWhiteList())
   * @param account optional, default is the current account
   * @returns true if account is whitelisted
   */
  public async isWhitelisted(url: string, account?: Address): Promise<boolean> {
    const list = await this.getWhiteList(url);
    return list ? list.has(account ?? this.ethereumService.defaultAccountAddress) : false;
  }
}
