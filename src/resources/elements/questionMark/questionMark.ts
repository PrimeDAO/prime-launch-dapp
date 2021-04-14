import tippy from "tippy.js";
import { containerless } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./questionMark.scss";

@containerless
export class QuestionMark {
  @bindable.string text: string;
  @bindable.string placement = "top";

  questionMark: HTMLElement;

  attached(): void {
    tippy(this.questionMark);
  }
}
