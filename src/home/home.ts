import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";

@singleton(false)
@autoinject
export class Home {

  seeingMore = false;
  bookmark: string;

  constructor(
    private router: Router,
  ) {
  }

  activate(params: { bookmark?: string}): void {
    this.bookmark = params?.bookmark;
  }

  attached(): void {
    if (this.bookmark) {
      document.getElementById(this.bookmark).scrollIntoView();
      this.bookmark = undefined;
    }
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }

  seeMore(yesNo: boolean): void {
    this.seeingMore = yesNo;
  }
}
