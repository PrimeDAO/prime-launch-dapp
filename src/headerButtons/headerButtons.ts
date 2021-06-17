import { containerless } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./headerButtons.scss";

@containerless
export class HeaderButtons {
  @bindable.booleanAttr vertical: boolean;
}
