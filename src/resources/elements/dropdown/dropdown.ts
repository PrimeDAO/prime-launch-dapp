import { autoinject, bindingMode, computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./dropdown.scss";

@autoinject
export class Dropdown {
  /**
   * Optional function that should return the label for the selected item.
   */
  @bindable getLabel?: ({ index: number }) => any;
  @bindable.string placeholder = "Select...";
  @bindable.number({ defaultBindingMode: bindingMode.twoWay }) selectedItemIndex: number;

  private dropdown: HTMLElement;
  private dropdownOptions: Array<Element>;
  private title: HTMLElement;
  private menu: HTMLElement;
  private titleText: string;

  // @computedFrom("selectedItemIndex")
  // get selection(): number { return this.selectedItemIndex; }
  // set selection(newValue: number) {
  //   if (newValue !== this.selectedItemIndex) {
  //     this.selectedItemIndex = newValue;
  //   }
  // }

  async attached(): Promise<void> {
    this.title.addEventListener("click", (e) => this.toggleMenuDisplay(e));
    this.menuChanged();
  }

  menuChanged(): void {
    /**
     * add class to each
     */
    this.dropdownOptions = Array.from(this.menu.children);
    this.dropdownOptions.forEach((item, index) => {
      item.classList.add("option");
      item.addEventListener("click", (e) => this.handleOptionSelected(e, index));
    });
  }

  toggleClass(elem: HTMLElement, className: string): HTMLElement {
    if (elem.classList.contains(className)) {
      elem.classList.remove(className);
    } else {
      elem.classList.add(className);
    }

    return elem;
  }

  // toggleDisplay(elem: HTMLElement): void {
  //   const curDisplayStyle = elem.style.display;

  //   if (curDisplayStyle === "none" || curDisplayStyle === "") {
  //     elem.style.display = "block";
  //   }
  //   else {
  //     elem.style.display = "none";
  //   }
  // }

  toggleMenuDisplay(_e: Event): void {
    this.toggleClass(this.menu, "hide");
    this.toggleClass(this.title, "menuShowing");
  }

  handleOptionSelected(e: Event, ndx: number): void {
    this.toggleClass(this.menu, "hide");
    // this.toggleClass((e.target as any).parentNode, "hide");

    const newValue = this.getLabel ? this.getLabel({ index: ndx }) : this.dropdownOptions[ndx].innerHTML;
    // const icon = document.querySelector(".dropdown .selectedLabel .fa");

    this.titleText = newValue;
    this.selectedItemIndex = ndx;
    //    this.title.appendChild(icon);

    //trigger custom event
    //this.title.dispatchEvent(new Event("change"));
    //setTimeout is used so transition is properly shown
    // setTimeout(() => this.toggleClass(icon, "rotate-90"));
  }
}
