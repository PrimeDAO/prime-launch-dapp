import { autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./rangeInput.scss";

@autoinject
export class RangeInput {
  @bindable.string private maxAllowed?;
  @bindable.string private name;
  @bindable.number public value = this.maxAllowed || 50;
  @bindable public setWeight;
  @bindable.string private val1: string;
  @bindable.string private val2: string;
  @bindable.ref private rangeInput: HTMLInputElement;
  @bindable.string private fundingToken = "";
  @bindable.string private projectToken = "";

  attached(): void {
    this.val1 = this.value + "%";
    this.val2 = 100 - this.value + "%";
    this.rangeInput.addEventListener("input", this.handleInputChange.bind(this));
    this.rangeInput.style.backgroundImage = `linear-gradient(
      90deg, 
      #a258a7 0%, 
      #ff497a ${(this.value)}%, 
      #8668fc ${(this.value)}%, 
      #a258a7 100%
    )`;
  }

  detached(): void {
    this.rangeInput.removeEventListener("input", this.handleInputChange.bind(this));
  }

  handleInputChange():void {
    if (this.maxAllowed && this.value > this.maxAllowed) {
      this.value = this.maxAllowed;
      return;
    }
    this.val1 = Math.round(this.value) + "%";
    this.val2 = Math.round(100 - this.value) + "%";

    this.rangeInput.style.backgroundImage = `linear-gradient(
      90deg, 
      #a258a7 0%, 
      #ff497a ${(this.value)}%, 
      #8668fc ${(this.value)}%, 
      #a258a7 100%
    )`;
  }
}


