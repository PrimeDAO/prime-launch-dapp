import "./horizontal-scroller.scss";

export class HorizontalScroller {

  scroller: HTMLElement;

  left(): void {
    this.scroller.scrollLeft -= this.scroller.clientWidth * .9;
  }

  right(): void {
    this.scroller.scrollLeft += this.scroller.clientWidth * .9;
  }
}
