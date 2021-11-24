import { AureliaHelperService } from "services/AureliaHelperService";
import { autoinject } from "aurelia-framework";
import "./spark-chart.scss";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, LineWidth, LineStyle} from "lightweight-charts";
import { bindable } from "aurelia-typed-observable-plugin";
import { NumberService } from "services/NumberService";

interface ISeries {
  name: string,
  data: Array<any>,
  color: string,
  lineStyle?: LineStyle,
  lineWidth?: LineWidth,
}

@autoinject
export class SparkChart {
  @bindable data: Array<ISeries>;
  @bindable.booleanAttr interactive;
  @bindable.number height = 300;
  @bindable.number width = 500;

  chart: IChartApi;
  series: Array<ISeriesApi<"Line">> = [];

  container: HTMLElement;
  sparkChart: HTMLElement;

  constructor(
    private numberService: NumberService,
    private aureliaHelperService: AureliaHelperService,
  ) {
  }

  attached(): void {
    this.aureliaHelperService.createPropertyWatch(this.container, "offsetWidth", () => this.resizeChart());

    if (!this.chart) {
      this.createChart();
    }

    this.dataChanged();
  }

  private resizeChart() {
    if (this.chart && this.data && this.container) {
      this.chart.resize(this.container.offsetWidth, this.container.offsetHeight);
      this.chart.timeScale().fitContent();
    }
  }

  createChart(): void {
    const options: any = { // DeepPartial<ChartOptions> = {
      width: this.width,
      height: this.height,
      timeScale: {
        // rightBarStaysOnScroll: true,
        visible: true,
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: { visible: true },
        horzLine: { visible: true },
        mode: CrosshairMode.Magnet,
      },
      priceScale: {
        position: "right",
      },
      localization: {
        priceFormatter: price =>
          "$ " + price.toFixed(2),
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
    options.timeScale.barSpacing = Math.max(options.width / this.data[0].data?.length || 1, 6);

    this.chart = createChart(this.sparkChart, options);

    this.data.forEach((series) => {
      const newSeries = this.chart.addLineSeries({
        color: series.color,
        priceLineVisible: false,
        title: series.name || "",
        crosshairMarkerVisible: this.interactive,
        priceFormat: {
          type: "custom",
          formatter: value => `${this.numberService.toString(value, {
            mantissa: 2,
            thousandSeparated: true,
          })}`,
        },
      });
      newSeries.applyOptions({
        lineStyle: series.lineStyle || 0,
        lineWidth: series.lineWidth || 2,
      });
      this.series.push(newSeries);
    });
  }

  dataChanged(): void {

    if (this.data && this.chart) {
      this.data.forEach((series, index) => {
        if (series.data) {
          this.series[index].setData(series.data.map(item => ({
            time: item.time,
            value: item.price,
          })));
          this.resizeChart();
        }
      });
    }
  }

  private innerDimensions(node: HTMLElement): { width: number, height: number } {
    const computedStyle = window.getComputedStyle(node);

    let width = node.clientWidth; // width with padding
    let height = node.clientHeight; // height with padding

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
  }
}
