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
  @bindable.booleanAttr gridHorizontal = false;
  @bindable.booleanAttr gridVertical = false;
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
        secondsVisible: false,
        borderVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          return new Date(time * 1000).toLocaleDateString(locale, {day: "2-digit", month: "short", year: "2-digit"});
        },
      },
      crosshair: {
        vertLine: {
          visible: true,
          width: 1,
          color: "rgba(224, 227, 235, 0.3)",
          style: 0,
        },
        horzLine: {
          visible: true,
          width: 1,
          color: "rgba(224, 227, 235, 0.3)",
          style: 0,
        },
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
          visible: this.gridHorizontal,
          color: "#403453",
        },
        vertLines: {
          visible: this.gridVertical,
          color: "#403453",
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
      console.log("dataChanged- SparkChart", {data: this.data[0].data?.map(i => {return {price: i.price, time: new Date(i.time * 1000)};})});
      this.data.forEach((series, index) => {
        if (series.data?.length) {
          this.series[index].setData(series.data.map(item => ({
            time: item.time,
            value: item.price,
          })));
          this.resizeChart();
        }
        this.chart.timeScale().fitContent();
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
