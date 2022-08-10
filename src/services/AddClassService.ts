import { autoinject } from "aurelia-framework";
import { DialogCloseResult, DialogService } from "./DialogService";
import { AddClassModal, IParameter } from "../resources/dialogs/addClass/addClass";
import { IClass } from "newLaunch/launchConfig";

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

  public show(params: { isEdit: boolean, index: number, editedClass: IClass | undefined }, addFunction: (classToAdd: any) => void, editFunction: ({ newClass, index }: {newClass: IClass; index: number}) => void): Promise<DialogCloseResult> {
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
