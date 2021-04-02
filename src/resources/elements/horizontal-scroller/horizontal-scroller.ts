import { autoinject } from "aurelia-framework";
import { CssAnimator } from "aurelia-animator-css";
import "./horizontal-scroller.scss";
import { bindable } from "aurelia-typed-observable-plugin";

@autoinject
export class HorizontalScroller {
  constructor (
    private animator: CssAnimator,
  ) {}

  scroller: HTMLElement;
  scrollPos: number;
  @bindable.number itemCount: number;

  left(): void {
    const scrollDistance = this.scrollDistance();
    const scrollPos = (this.scrollPos ?? 0);

    this.scroller.scroll({
      left: scrollPos - Math.min(scrollPos, scrollDistance),
      behavior: "smooth",
    });
  }

  right(): void {
    const scrollDistance = this.scrollDistance();
    const scrollPos = (this.scrollPos ?? 0);

    this.scroller.scroll({
      left: scrollPos + Math.min(this.scroller.scrollWidth - scrollPos, scrollDistance),
      behavior: "smooth",
    });
  }

  scrollDistance(): number {
    const visibleWidth = this.scroller.clientWidth;
    const itemWidth = this.scroller.scrollWidth / this.itemCount;
    // itemWidth better not be 0
    const visibleItemsCount = Math.floor(visibleWidth / itemWidth);
    return itemWidth * visibleItemsCount;
  }
}
