import { autoinject } from "aurelia-framework";
import { DialogCloseResult, DialogService } from "services/DialogService";
import { AddClassModal } from "resources/dialogs/addClass/addClass";
import { IContributorClass } from "entities/Seed";

export interface ISeedClass {
  name: string
  classCap: number
  individualCap: number
  price: number
  vestingDuration: number
  classVestingStartTime: number
  classFee: number
}

@autoinject
export class AddClassService {

  constructor(
    private dialogService: DialogService,
  ) {
  }

  public show(
    params: {
      index: number,
      editedClass: IContributorClass | undefined,
    },
    addFunction: (classToAdd: IContributorClass) => void,
    editFunction: ({ newClass, index }: { newClass: IContributorClass; index: number; }) => void): Promise<DialogCloseResult> {
    let theContainer: Element;

    return this.dialogService.open(AddClassModal, {params, addFunction, editFunction}, {
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
        });
  }
}
