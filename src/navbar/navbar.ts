import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Utils } from "services/utils";
import "./navbar.scss";

@autoinject
export class Navbar {
  menuOpen = false;

  constructor(private router: Router) {}

  private toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  private goto(url: string): void {
    this.menuOpen = false;
    Utils.goto(url);
  }

  private navigate(href: string): void {
    this.menuOpen = false;
    this.router.navigate(href);
  }
}
