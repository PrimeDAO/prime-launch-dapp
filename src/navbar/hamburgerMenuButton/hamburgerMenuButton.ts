import { bindable } from "aurelia-framework";
import "./hamburgerMenuButton.scss";

export class HamburgerMenuButton {
  @bindable private isOpen = false;

  private toggleMenu() {
    this.isOpen = !this.isOpen;
    console.log("open");
  }
  private openMenu() {
    this.isOpen = true;
    console.log("open");
  }
  private closeMenu() {
    this.isOpen = false;
    console.log("close");
  }
}
