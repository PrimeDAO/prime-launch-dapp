import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, observable, computedFrom } from "aurelia-framework";
import { EthereumService, toWei, Address } from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import { LaunchService } from "services/LaunchService";
import { IContributorClass, Seed } from "entities/Seed";
import { EventConfigFailure } from "services/GeneralEvents";
import { NumberService } from "services/NumberService";
import { BigNumber } from "ethers";
import { Utils } from "services/utils";
import "./addClass.scss";
import { splitByWordSeparators } from "services/StringService";
import { DEV_ADDRESSES } from "navbar/navbar";

const EMPTY_CLASS = {
  className: undefined,
  classCap: undefined,
  individualCap: undefined,
  classVestingDuration: undefined,
  classVestingCliff: undefined,
  allowList: undefined,
};

@autoinject
export class AddClassModal {

  private model: IAddClassModal;
  private okButton: HTMLElement;
  private isEdit = false;
  private loadingAllowlist = false;
  private __dev_allowList = "";
  private classPurchaseLimitText: string;

  verified: boolean;
  class: IContributorClass = EMPTY_CLASS;
  isDev = false;
  @observable csv: File

  @computedFrom("model.params.index", "model.params.editedClass")
  get disableEditingOfClassName(): boolean {
    const isDefaultClassIndex = this.model?.params?.index === 0;
    const isEditingClass = !!this.model?.params?.editedClass;
    const disable = isDefaultClassIndex && isEditingClass;
    return disable;
  }

  constructor(
    private controller: DialogController,
    protected eventAggregator: EventAggregator,
    protected ethereumService: EthereumService,
    private launchService: LaunchService,
    private numberService: NumberService,
  ) {
    this.isDev = process.env.NODE_ENV === "development" && DEV_ADDRESSES.includes(this.ethereumService.defaultAccountAddress);
  }

  private async csvChanged(newValue: File[]): Promise<void> {
    this.loadingAllowlist = true;
    const csvContent = newValue && await newValue[0].text();
    const cleanedCsv = new Set<string>(splitByWordSeparators(csvContent));
    this.class.allowList = cleanedCsv;
    this.loadingAllowlist = false;
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
    const hardCap = this.model.params.hardCap;

    if (!this.class.className) { /* ⚠️ Empty Class name */
      message = "Please enter a value for Class Name";
    } else if (!this.class.classCap) {
      message = "Please enter a contributor class purchase limit";
    } else if (this.class.classCap.gt(hardCap)) { /* ⚠️ ClassCap ≤ HardCAP */
      message = "Please enter a value for Class Purchase limit that is lower or equal to the Funding Tokens Maximum value";
    } else if (!this.class.individualCap) {
      message = "Please enter a value for project token purchase limit";
    } else if (this.class.individualCap.gt(this.class.classCap)) { /* ⚠️ IndividualCap ≤ ClassCAP */
      message = "Please enter a value for Project token Purchase limit that is lower or equal to the Class Purchase limit value";
    } else if (this.class.individualCap.gt(hardCap)) { /* ⚠️ IndividualCap ≤ HardCAP */
      message = "Please enter a value for Project token Purchase limit that is lower or equal to the Funding Tokens Maximum";
    } else if (this.class.classVestingDuration === null || this.class.classVestingDuration === undefined) {
      message = "Please enter a value for \"Project tokens vested for\" ";
    } else if (this.class.classVestingCliff === null || this.class.classVestingCliff === undefined) {
      message = "Please enter a value for \"with a cliff of\" ";
    } else if (this.class.classVestingCliff > this.class.classVestingDuration) {
      message = "Please enter a value of \"with a cliff of\" lower or equal to \"Tokens vested for\"";
    }

    this.verified = !message;
    return Promise.resolve(message);
  }

  public attached(): void {
    this.okButton.focus();

    this.classPurchaseLimitText = `The maximum amount of contribution (${this.model.params.seed.fundingTokenInfo.symbol}) the allowlisted users within one class can contribute to the launch.`;
  }

  @computedFrom("class.allowList")
  get allowlistUrlIsValid(): boolean {
    if (!this.class.allowList || !this.class.allowList.size) return false;

    const validAddress = [...this.class.allowList]
      .filter((address: Address) => (address && Utils.isAddress(address)));
    const listIsValid = validAddress.length === this.class.allowList.size;
    return listIsValid;
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
    const CLASS_VESTING_DURATION = 1 * daysToSeconds;
    const CLASS_VESTING_START_TIME = 0 * daysToSeconds;
    this.class = {
      className: "Test Class - " + new Date().toDateString(),
      classCap: toWei(1, this.model.params.fundingTokenInfo.decimals),
      individualCap: toWei(1, this.model.params.fundingTokenInfo.decimals),
      classVestingDuration: CLASS_VESTING_DURATION,
      classVestingCliff: CLASS_VESTING_START_TIME,
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
    seed: Seed,
  },
  addFunction: (newClass: IContributorClass) => void,
  editFunction: ({ editedClass, index }: IParameter) => void,
}

export interface IParameter {
  editedClass: IContributorClass,
  index: number,
}
