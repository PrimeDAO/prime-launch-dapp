import {
  DialogCancellableOpenResult,
  DialogCloseResult,
  DialogOpenPromise,
  DialogService as AureliaDialogService,
  DialogSettings,
} from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import { ConsoleLogService } from "services/ConsoleLogService";

@autoinject
export class DialogService {

  constructor(
    private dialogService: AureliaDialogService,
    private consoleLogService: ConsoleLogService) {
  }

  public open(
    viewModule: unknown, // result of `import {view} from "path to module files"`
    model: unknown, // object that is given to the module's `activate` function
    settings: DialogSettings = {}): DialogOpenPromise<DialogCancellableOpenResult> {

    //    this.adjustScroll();

    return this.dialogService.open(
      Object.assign({
        model,
        viewModel: viewModule,
      }, settings));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public axiosErrorHandler(err: any): string {
    let errorMsg: string;

    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMsg = `HTTP status ${err.response.status}`;
      this.consoleLogService.logMessage(err.response.data, "error");
      this.consoleLogService.logMessage(err.response.status, "error");
      this.consoleLogService.logMessage(err.response.headers, "error");
    } else if (err.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      errorMsg = `No response: ${err.message}`;
      this.consoleLogService.logMessage(err.message, "error");
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMsg = `Unknown error: ${err.message}`;
      this.consoleLogService.logMessage(err.message, "error");
    }
    return errorMsg;
  }
}

export { DialogCloseResult };
