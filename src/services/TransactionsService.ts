import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { EthereumService, Hash, Networks } from "services/EthereumService";

@autoinject
export default class TransactionsService {

  private static blocksToConfirm = 3;

  constructor(
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
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
      this.eventAggregator.publish("transaction.failed", ex);
      return null;
    }
  }

  public getEtherscanLink(txHash: Hash): string {
    let targetedNetwork = this.ethereumService.targetedNetwork as string;
    if (targetedNetwork === Networks.Mainnet) {
      targetedNetwork = "";
    } else {
      targetedNetwork = targetedNetwork + ".";
    }
    return `http://${targetedNetwork}etherscan.io/tx/${txHash}`;
  }
}

export { TransactionResponse } from "@ethersproject/providers";
export { TransactionReceipt } from "@ethersproject/providers";
