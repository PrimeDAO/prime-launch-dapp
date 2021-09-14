import { autoinject } from "aurelia-framework";
import { DialogCloseResult, DialogService } from "./DialogService";
import { Congratulations } from "../resources/dialogs/congratulations/congratulations";

@autoinject
export class CongratulationsService {

  constructor(
    private dialogService: DialogService,
  ) {
  }

  public show(message: string): Promise<DialogCloseResult> {
    /**
     * hack we gotta go through because of how the gradient border, size
     * and position of the dialog is defined in ux-dialog-container.
     * See congratulations.scss and dialogs.scss.  We have no other way to selectively
     * alter the css of that element.  Once congratulations.scss is loaded, it forever overrides
     * the default styling on ux-dialog-container.
     */
    let theContainer: Element;

    return this.dialogService.open(Congratulations, { message }, {
      keyboard: true,
      position: (modalContainer: Element, _modalOverlay: Element): void => {
        theContainer = modalContainer;
        modalContainer.classList.add("congratulations");
      },
    })
      .whenClosed(
        (result: DialogCloseResult) => {
          theContainer.classList.remove("congratulations");
          return result;
        },
        // not sure if this works for alert
        (error: string) => { return { output: error, wasCancelled: false }; });
  }
}
