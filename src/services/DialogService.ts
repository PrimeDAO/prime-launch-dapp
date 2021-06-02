import {
  DialogCancellableOpenResult,
  DialogCloseResult,
  DialogOpenPromise,
  DialogService as AureliaDialogService,
  DialogSettings,
} from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import { Alert } from "../resources/dialogs/alert/alert";
import { Disclaimer } from "../resources/dialogs/disclaimer/disclaimer";

@autoinject
export class DialogService {

  constructor(
    private dialogService: AureliaDialogService) {
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

  public alert(message: string): Promise<DialogCloseResult> {
    return this.open(Alert, { message }, { keyboard: true })
      .whenClosed(
        (result: DialogCloseResult) => result,
        // not sure if this works for alert
        (error: string) => { return { output: error, wasCancelled: false }; });
  }

  public disclaimer(disclaimerUrl: string): Promise<DialogCloseResult> {
    return this.open(Disclaimer, { disclaimerUrl }, { keyboard: true })
      .whenClosed(
        (result: DialogCloseResult) => result,
        (error: string) => { return { output: error, wasCancelled: false }; });
  }
}
