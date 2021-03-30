import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";

@singleton(false)
@autoinject
export class Home {

  constructor(
    private router: Router,
  ) {
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }
}
