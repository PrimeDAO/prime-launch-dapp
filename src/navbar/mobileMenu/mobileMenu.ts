import { autoinject, bindable } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./mobileMenu.scss";

@autoinject
export class MobileMenu {
  @bindable menuOpen: boolean;
  @bindable gotoCallback: ({url: string}) => void;
  @bindable navigateCallback: ({href: string}) => void;

  constructor(private router: Router) {}
}
