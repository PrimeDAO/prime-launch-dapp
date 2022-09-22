import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { EthereumService, toWei, fromWei } from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import { LaunchService } from "services/LaunchService";
import { IContributorClass } from "entities/Seed";
import { EventConfigFailure } from "services/GeneralEvents";
import { NumberService } from "services/NumberService";
import { BigNumber } from "ethers";
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
  private isEdit: boolean = false;

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
    this.isEdit = this.model.params.index !== null;

    if (this.isEdit) {
      this.class = this.model.params.editedClass;
    }
  }

  protected validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }

  async validateInputs(): Promise<string> {
    let message: string;
    // Make sure that the Funding Token decimals are comparable (eg USDC has only 6 decimals)
    const hardCap = toWei(this.numberService.fromString(
      fromWei(
        this.model.params.hardCap,
        this.model.params.fundingTokenInfo.decimals)
    ));

    if (!this.class.className) { /* ⚠️ Empty Class name */
      message = "Please enter a value for Class Name";
    } else if (!this.class.classCap) {
      message = "Please enter a contributor class purchase limit";
    } else if (this.class.classCap.gt(hardCap)) { /* ⚠️ ClassCap ≤ HardCAP */
      message = "Please enter a value for Class Purchase limit that is lower or equal to the Funding Tokens Maximum value";
    } else if (!this.class.individualCap) {
      message = "Please enter a value for project token purchase limit";
    } else if (this.class.individualCap.gt(hardCap)) { /* ⚠️ IndividualCap ≤ HardCAP */
      message = "Please enter a value for Project token Purchase limit that is lower or equal to the Funding Tokens Maximum";
    } else if (this.class.individualCap.gt(this.class.classCap)) { /* ⚠️ IndividualCap ≤ ClassCAP */
      message = "Please enter a value for Project token Purchase limit that is lower or equal to the Class Purchase limit value";
    } else if (this.class.classVestingDuration === null) {
      message = "Please enter a value for \"Project tokens vested for\" ";
    } else if (this.class.classVestingCliff === null) {
      message = "Please enter a value for \"with a cliff of\" ";
    } else if (this.class.classVestingCliff > this.class.classVestingDuration) {
      message = "Please enter a value of \"with a cliff of\" lower or equal to \"Tokens vested for\"";
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
    if (this.isEdit) {
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
    hardCap: BigNumber,
    fundingTokenInfo: ITokenInfo,
    editedClass: IContributorClass | undefined,
  },
  addFunction: (newClass: IContributorClass) => void,
  editFunction: ({ editedClass, index }: IParameter) => void,
}

export interface IParameter {
  editedClass: IContributorClass,
  index: number,
}
