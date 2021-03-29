import { autoinject } from "aurelia-framework";
import "./spark-chart.scss";
import { createChart, CrosshairMode, IChartApi } from "lightweight-charts";
import { bindable } from "aurelia-typed-observable-plugin";
import { NumberService } from "services/numberService";

@autoinject
export class SparkChart {
  @bindable data;
  @bindable.booleanAttr interactive;
  @bindable.number height = 300;

  chart: IChartApi;

  container: HTMLElement;
  sparkChart: HTMLElement;

  constructor(private numberService: NumberService) {
  }

  attached(): void {
    if (!this.chart) {
      const options: any = { // DeepPartial<ChartOptions> = {
        width: 0,
        height: this.height,
        timeScale: {
          // rightBarStaysOnScroll: true,
          visible: this.interactive,
        },
        crosshair: {
          vertLine: { visible: this.interactive },
          horzLine: { visible: this.interactive },
          mode: CrosshairMode.Magnet,
        },
        priceScale: {
          position: this.interactive ? "right" : "none",
        },
        grid: {
          horzLines: {
            visible: false,
          },
          vertLines: {
            visible: false,
          },
        },
        layout: {
          backgroundColor: "transparent",
          textColor: "black",
          fontFamily: "Aeonik",
        },
        handleScroll: {
          mouseWheel: false,
          pressedMouseMove: this.interactive,
          horzTouchDrag: this.interactive,
          vertTouchDrag: this.interactive,
        },
        handleScale: {
          mouseWheel: this.interactive,
          pinch: this.interactive,
          axisDoubleClickReset: this.interactive,
          axisPressedMouseMove: {
            time: false,
            price: false,
          },
        },
      };

      // we want dimensions not-including padding
      const innerDimensions = this.innerDimensions(this.sparkChart);
      options.width = innerDimensions.width;
      options.height = this.height || innerDimensions.height;
      options.timeScale.barSpacing = Math.max(options.width / this.data.length, 6);

      this.chart = createChart(this.sparkChart, options);

      const color = "#8668FC";
      const series = this.chart.addAreaSeries({
        lineColor: color,
        topColor: `${color}ff`,
        bottomColor: `${color}00`,
        priceLineVisible: false,
        crosshairMarkerVisible: this.interactive,
        priceFormat: {
          type: "custom",
          formatter: value => `${this.numberService.toString(value, {
            precision: 2,
            thousandSeparated: true,
          })}`,
        },
      });

      series.setData(this.data);

      window.onresize = () => {
        /**
         * don't resize when the element is hidden, or height will go permanently to 0
         */
        setTimeout(() => {
          if (this.chart) {
            this.chart.resize(this.container.offsetWidth, this.container.offsetHeight);
          }
        }, 200);
      };
    }
  }

  private innerDimensions(node: HTMLElement) {
    const computedStyle = window.getComputedStyle(node);

    let width = node.clientWidth; // width with padding
    let height = node.clientHeight; // height with padding

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
  }

  detached(): void {
    window.onresize = undefined;
  }
}
