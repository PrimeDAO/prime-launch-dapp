import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { EthereumService, toWei } from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import { LaunchService } from "services/LaunchService";
import { IContributorClass } from "entities/Seed";
import { EventConfigFailure } from "services/GeneralEvents";
import { NumberService } from "services/NumberService";
import "./addClass.scss";

const EMPTY_CLASS = {
  className: undefined,
  classCap: undefined,
  individualCap: undefined,
  classVestingDuration: undefined,
  classVestingCliff: undefined,
  allowList: undefined,
}

@autoinject
export class AddClassModal {

  private model: IAddClassModal;
  private okButton: HTMLElement;

  verified: boolean;
  class: IContributorClass = EMPTY_CLASS;
  isDev: boolean = false;

  constructor(
    private controller: DialogController,
    protected eventAggregator: EventAggregator,
    protected ethereumService: EthereumService,
    private launchService: LaunchService,
    private numberService: NumberService,
  ) {
    this.isDev = process.env.NODE_ENV === 'development' && this.ethereumService.defaultAccountAddress === "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1";
  }

  public async activate(model: IAddClassModal): Promise<void> {
    this.model = model;

    const isEdited = this.model.params.index !== null;
    if (isEdited) {
      this.class = this.model.params.editedClass;
    }
  }

  protected validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }

  async validateInputs(): Promise<string> {
    let message: string;

    if (!this.class.className) {
      message = "Please enter Class Name";
    } else if (!this.class.classCap ) {
      message = "Please enter a contributor class purchase limit";
    } else if (this.class.classCap.lte(0)) {
      message = "Please enter a number greater than zero for the contributor class purchase limit";
    } else if (!this.class.individualCap) {
      message = "Please enter a number a project token purchase limit";
    } else if (this.class.individualCap.lte(0)) {
      message = "Please enter a number greater than zero for the project token purchase limit";
    } else if (this.class.individualCap.gt(this.class.classCap)) {
      message = "Please enter a value for project token purchase limit less than or equal to contributor class purchase limit";
    } else if (!this.class.classVestingDuration || this.class.classVestingDuration.lte(0)) {
      message = "Please enter a number greater than or equal to zero for \"Project tokens vested for\" ";
    } else if (!this.class.classVestingCliff || this.class.classVestingCliff.lte(0)) {
      message = "Please enter a number greater than or equal to zero for \"with a cliff of\" ";
    } else if (this.class.classVestingCliff >= this.class.classVestingDuration) {
      message = "Please enter a value of \"with a cliff of\" less than \"Project tokens vested for\"";
    }


    this.verified = !message;
    return Promise.resolve(message);
  }

  public attached(): void {
    this.okButton.focus();
  }

  resetModal(): void {
    this.class = EMPTY_CLASS;
  }

  async save(): Promise<void> {
    if (this.model.params.index !== null) {
      await this.editClass();
    } else {
      await this.addClass();
    }
  }

  async addClass(): Promise<void> {
    const message: string = await this.validateInputs();

    if (message) {
      this.validationError(message);
      return;
    } else {
      const newClass: IContributorClass = {
        className: this.class.className,
        classCap: this.class.classCap,
        individualCap: this.class.individualCap,
        classVestingDuration: this.class.classVestingDuration,
        classVestingCliff: this.class.classVestingCliff,
        allowList: this.class.allowList,
      };

      this.model.addFunction(newClass);
      this.resetModal();
      await this.controller.ok();
    }
  }

  async editClass(): Promise<void> {
    const message: string = await this.validateInputs();

    if (message) {
      this.validationError(message);
      return;
    } else {
      const editedClass: IContributorClass = this.class;
      const index = this.model.params.index;
      this.model.editFunction({editedClass, index});

      this.resetModal();
      await this.controller.ok();
    }
  }

  fillDummyValues() {
    const daysToSeconds = 60 * 60 * 24;

    this.class = {
      className: "Test Class - " + new Date().toDateString(),
      classCap: toWei(1000),
      individualCap: toWei(750),
      classVestingDuration: toWei(4 * daysToSeconds),
      classVestingCliff: toWei(2 * daysToSeconds),
      allowList: undefined,
    };
  }
}

interface IAddClassModal {
  params: {
    index: number,
    editedClass: IContributorClass | undefined,
    projectTokenInfo: ITokenInfo,
  },
  addFunction: (newClass: IContributorClass) => void,
  editFunction: ({ editedClass, index }: IParameter) => void,
}

export interface IParameter {
  editedClass: IContributorClass,
  index: number,
}
