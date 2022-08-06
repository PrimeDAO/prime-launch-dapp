import { autoinject } from "aurelia-framework";
import { DialogCloseResult, DialogService } from "./DialogService";
import { AddClassModal } from "../resources/dialogs/addClass/addClass";

@autoinject
export class AddClassService {

  constructor(
    private dialogService: DialogService,
  ) {
  }

  public show(parameter: number | undefined): Promise<DialogCloseResult> {
    let theContainer: Element;

    return this.dialogService.open(AddClassModal, {parameter}, {
      keyboard: true,
      position: (modalContainer: Element, _modalOverlay: Element): void => {
        theContainer = modalContainer;
        modalContainer.classList.add("addClass");
      },
    })
      .whenClosed(
        (result: DialogCloseResult) => {
          theContainer.classList.remove("addClass");
          return result;
        },
        // not sure if this works for alert
        (error: string) => { return { output: error, wasCancelled: false }; });
  }
}
