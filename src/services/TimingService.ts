/* eslint-disable no-console */
import { EthereumService } from "services/EthereumService";

export class TimingService {

  public static start(label: string): void {
    if ((EthereumService.targetedNetwork !== "mainnet") ||
      (process.env.NODE_ENV === "development")) {
      console.time(label);
    }
  }

  public static end(label: string): void {
    if ((EthereumService.targetedNetwork !== "mainnet") ||
      (process.env.NODE_ENV === "development")) {
      console.timeEnd(label);
    }
  }
}
