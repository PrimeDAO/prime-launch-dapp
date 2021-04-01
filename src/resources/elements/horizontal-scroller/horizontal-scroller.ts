import { autoinject } from "aurelia-framework";
import { CssAnimator } from "aurelia-animator-css";
import "./horizontal-scroller.scss";

@autoinject
export class HorizontalScroller {
  constructor (
    private animator: CssAnimator,
  ) {}

  scroller: HTMLElement;
  scrollPos: number;

  left(): void {
    const scrollPos = (this.scrollPos ?? 0);
    this.scroller.scroll({
      left: scrollPos - Math.min(scrollPos, this.scroller.clientWidth * .45),
      behavior: "smooth",
    });
  }

  right(): void {
    const scrollPos = (this.scrollPos ?? 0);
    this.scroller.scroll({
      left: scrollPos + Math.min(this.scroller.clientWidth - scrollPos, this.scroller.clientWidth * .45),
      behavior: "smooth",
    });
  }
}
