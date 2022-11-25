import { BalancerService } from "services/BalancerService";
import { Utils } from "services/utils";
import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { EthereumService, Hash } from "services/EthereumService";
import { EventConfigException } from "./GeneralEvents";

@autoinject
export default class TransactionsService {

  private static blocksToConfirm = 1;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
    private utils: Utils,
  ) { }

  public async send(methodCall: () => Promise<TransactionResponse>): Promise<TransactionReceipt> {
    let receipt: TransactionReceipt;
    try {
      this.eventAggregator.publish("transaction.sending");
      const response = await methodCall();
      this.eventAggregator.publish("transaction.sent", response);
      receipt = await response.wait(1);
      this.eventAggregator.publish("transaction.mined", { message: "Transaction was mined", receipt });
      receipt = await response.wait(TransactionsService.blocksToConfirm);
      this.eventAggregator.publish("transaction.confirmed", { message: "Transaction was confirmed", receipt });
      return receipt;
    } catch (ex) {
      let finalEx = ex;
      const balancerError = BalancerService.tryParseErrorCode(ex?.error?.message);
      if (balancerError) {
        finalEx.error.message = balancerError;
      } else if (ex?.data?.message) {
        const exMessage = ex.data.message;
        finalEx = new EventConfigException(exMessage, ex);
      }
      this.eventAggregator.publish("transaction.failed", finalEx);
      return null;
    }
  }

  public getEtherscanLink(txHash: Hash): string {
    return this.ethereumService.getEtherscanLink(txHash, true);
  }
}

export { TransactionResponse } from "@ethersproject/providers";
export { TransactionReceipt } from "@ethersproject/providers";
