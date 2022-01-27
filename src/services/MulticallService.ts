import { Address, EthereumService, Networks } from "services/EthereumService";
import { createWatcher } from "@makerdao/multicall";
const addresses = require("/node_modules/@makerdao/multicall/src/addresses.json");

type DataType = "uint256" | "bytes32" | "bool" | "uint8" | "address" | "bytes" | "string" | "int" | "uint" | "uint256[]";
type ResultHandler = (result: any) => void;

export interface IBatcherCallsModel {
  contractAddress: Address;
  functionName: string;
  paramTypes?: Array<DataType>;
  paramValues?: Array<any>;
  returnType: DataType;
  resultHandler: ResultHandler;
}

export interface IBatcher {
  start: () => Promise<void>;
  // haven't figured out how to use this
  // recreate: (newConfig: Array<IBatcherCallsModel>) => Promise<void>;
  // haven't figured out how to use this
  // addModel: (model: Array<IBatcherCallsModel>) => Promise<void>;
  stop: () => void;
}

export class MultiCallService {

  constructor() {
    addresses[Networks.Arbitrum] = {
      "multicall": "0xC2E9dDC765303D86B0D349bB5FE44D76d41cA74A",
      "rpcUrl": EthereumService.ProviderEndpoints[Networks.Arbitrum],
    };
  }
  public createBatcher(model: Array<IBatcherCallsModel>, autoStop = true): IBatcher {
    const config = {
      multicallAddress: addresses[EthereumService.targetedNetwork].multicall,
      rpcUrl: EthereumService.ProviderEndpoints[EthereumService.targetedNetwork],
      interval: 5000000, // basically disable polling, just take the first batch
      errorRetryWait: 5000000, // basically disable polling
    };

    const watcher = createWatcher(this.convertModel(model), config);

    return {
      start: (): Promise<void> => this.runBatch(watcher, autoStop),
      // recreate: (model: Array<IBatcherCallsModel>): Promise<void> => watcher.recreate(this.convertModel(model), config),
      // addModel: (model: Array<IBatcherCallsModel>): Promise<void> => this.addModel(watcher, model),
      stop: () => watcher.stop(),
    };
  }

  private runBatch(watcher, autoStop): Promise<void> {
    return watcher.start()
      // .catch((ex) => {
      // })
      .then(() => {
        if (autoStop) {
          watcher.stop();
        }
      });
  }

  /**
   * adds a model with its own poll
   * @param watcher
   * @param model
   * @returns
   */
  // private addModel(watcher, model: Array<IBatcherCallsModel>): Promise<void> {
  //   return watcher.tap((_calls) => this.convertModel(model))
  //     .then(() => {
  //       console.log("got the tapped batch!");
  //     })
  //     .catch((ex) => {
  //       console.log("tapped batch failed", ex);
  //     });
  // }


  private convertModel(model: Array<IBatcherCallsModel>): Array<any> {
    let callCounter = 0;

    return model.map((config) => {
      return {
        target: config.contractAddress,
        call: [`${config.functionName}(${config.paramTypes?.join(",") ?? ""})(${config.returnType})`, ...(config.paramValues??[])],
        returns: [[(callCounter++).toString(), (val) => config.resultHandler(val)]],
      };
    });
  }
}
