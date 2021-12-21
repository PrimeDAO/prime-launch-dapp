import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { bindable } from "aurelia-typed-observable-plugin";
import { Utils } from "services/utils";
import "./navbar.scss";

@autoinject
export class Navbar {
  @bindable onNavigate?: () => void;
  @bindable menuOpen = false;

  constructor(private router: Router) {}

  private toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  private openMenu() {
    this.menuOpen = true;
  }
  private closeMenu() {
    this.menuOpen = false;
  }

  goto(url: string): void {
    this.closeMenu();
    Utils.goto(url);
  }

  navigate(href: string): void {
    this.closeMenu();
    if (this.onNavigate) {
      this.onNavigate();
    }
    this.router.navigate(href);
  }
}
