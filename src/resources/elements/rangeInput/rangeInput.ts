import { autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./rangeInput.scss";

@autoinject
export class RangeInput {
  @bindable.number val = 80;
  @bindable.string val1: string;
  @bindable.string val2: string;
  @bindable.ref rangeInput: HTMLInputElement;
  @bindable.string fundingToken = "";
  @bindable.string projectToken = "";

  attached(): void {
    this.val1 = this.val + "%";
    this.val2 = 100 - this.val + "%";
    this.rangeInput.addEventListener("input", this.handleInputChange.bind(this));
    this.rangeInput.style.backgroundImage = `linear-gradient(
      90deg, 
      #a258a7 0%, 
      #ff497a ${(this.val)}%, 
      #8668fc ${(this.val)}%, 
      #a258a7 100%
    )`;

  }

  handleInputChange():void {
    this.val1 = Math.round(this.val) + "%";
    this.val2 = Math.round(100 - this.val) + "%";

    this.rangeInput.style.backgroundImage = `linear-gradient(
      90deg, 
      #a258a7 0%, 
      #ff497a ${(this.val)}%, 
      #8668fc ${(this.val)}%, 
      #a258a7 100%
    )`;
  }
}


