import { Router } from "aurelia-router";
import { containerless } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./headerButtons.scss";

@containerless
export class HeaderButtons {
  @bindable.booleanAttr vertical: boolean;
  @bindable onNavigate?: () => void;

  constructor(private router: Router) {}

  navigate(href: string): void {
    if (this.onNavigate) {
      this.onNavigate();
    }
    this.router.navigate(href);
  }
}
