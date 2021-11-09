import { bindingMode } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./submitDisclaimers.scss";

export class SubmitDisclaimers {

  @bindable.booleanAttr({ defaultBindingMode: bindingMode.twoWay }) allConfirmed = false;
  @bindable({ defaultBindingMode: bindingMode.toView }) back: () => void;

  _checkedTerms = false;
  get checkedTerms(): boolean {
    return this._checkedTerms;
  }

  set checkedTerms(value: boolean) {
    this._checkedTerms = value;
    this.updateConfirmed();
  }

  _checkedReviewed = false;
  get checkedReviewed(): boolean {
    return this._checkedReviewed;
  }

  set checkedReviewed(value: boolean) {
    this._checkedReviewed = value;
    this.updateConfirmed();
  }

  _checkedPrivacy = false;
  get checkedPrivacy(): boolean {
    return this._checkedPrivacy;
  }

  set checkedPrivacy(value: boolean) {
    this._checkedPrivacy = value;
    this.updateConfirmed();
  }

  updateConfirmed(): void {
    this.allConfirmed = true; // this.checkedTerms && this.checkedReviewed && this.checkedPrivacy;
  }

  goBack(): void {
    this.back();
  }
}
