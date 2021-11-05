import { autoinject } from "aurelia-framework";
import "./spark-chart.scss";
import { createChart, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";
import { bindable } from "aurelia-typed-observable-plugin";
import { NumberService } from "services/NumberService";

@autoinject
export class SparkChart {
  @bindable data: Array<any>;
  @bindable.booleanAttr interactive;
  @bindable.number height = 300;
  @bindable.number width = 500;

  chart: IChartApi;
  series: ISeriesApi<"Line">;

  container: HTMLElement;
  sparkChart: HTMLElement;

  constructor(private numberService: NumberService) {
  }

  attached(): void {
    if (this.chart) {
      this.chart.resize(this.container.offsetWidth, this.container.offsetHeight);
    }
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

  detached(): void {
    window.onresize = undefined;
  }

  dataChanged(): void {
    if (this.data && !this.chart) {
      const options: any = { // DeepPartial<ChartOptions> = {
        width: this.width,
        height: this.height,
        timeScale: {
          // rightBarStaysOnScroll: true,
          visible: this.interactive,
          timeVisible: true,
          secondsVisible: true,
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
          textColor: "white",
          fontFamily: "Inter",
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
      options.width = this.width || innerDimensions.width;
      options.height = this.height || innerDimensions.height;
      options.timeScale.barSpacing = Math.max(options.width / this.data.length, 6);

      this.chart = createChart(this.sparkChart, options);


      const color = "#A258A7";
      this.series = this.chart.addLineSeries({
        color: color,
        priceLineVisible: false,
        crosshairMarkerVisible: this.interactive,
        priceFormat: {
          type: "custom",
          formatter: value => `${this.numberService.toString(value, {
            mantissa: 2,
            thousandSeparated: true,
          })}`,
        },
      });
    }

    if (this.data && this.chart) {
      this.series.setData(this.data);
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
}
