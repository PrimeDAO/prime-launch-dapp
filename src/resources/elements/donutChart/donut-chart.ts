import { autoinject } from "aurelia-framework";
import { IPoolTokenInfo, Pool } from "./../../../entities/pool";
import { bindable } from "aurelia-typed-observable-plugin";
import "./donut-chart.scss";
import * as d3 from "d3";
import { PoolService } from "services/PoolService";
import { NumberService } from "services/numberService";

@autoinject
export class DonutChart {

  @bindable pool: Pool;
  @bindable.booleanAttr interactive;
  chartContainer: HTMLElement;
  donutContainer: HTMLElement;

  constructor(private poolService: PoolService,
    private numberService: NumberService) {

  }

  async attached(): Promise<void> {
    await this.poolService.ensureInitialized();
    /**
     * sometimes for some reason this gets called before this.chartContainer and
     * this.donutContainer are initialized.  Happens when navigating to the containing page
     * when already on the containing page.
     */
    if (this.chartContainer && this.donutContainer) {
      const donuts = new Donut(this.chartContainer, this.donutContainer, this.interactive, this.numberService);
      donuts.create(this.pool);
    }
  }
}

class Donut {
  colors = ["#ff495b", "#8668fc", "#1ee0fc", "#95d86e", "#faa04a", "#39a1d8", "#57dea6", "#c08eff"];
  donutContainer;
  chartContainer;
  chartPadding;
  chartRadius;
  get innerCircleRadius() { return this.chartRadius * 0.5; }
  sliceBulgeFactor = 1.08;

  constructor(
    chartContainerElement: HTMLElement,
    private donutContainerElement: HTMLElement,
    private interactive: boolean,
    private numberService: NumberService) {

    this.donutContainer = d3.select(donutContainerElement);
    this.chartContainer = d3.select(chartContainerElement);
  }

  get donut() {
    return d3.select(this.donutContainerElement).select(".donut");
  }

  createCenter() {

    const thisChart_r = this.chartRadius;
    const donut = this.donut;
    const circleRadius = thisChart_r * 0.55;
    const interiorBorderRadius = circleRadius * .66;
    const interiorBorderWidth = 3;
    const interiorBorderInteriorRadius = interiorBorderRadius - interiorBorderWidth;
    const poolIconWidth = (interiorBorderRadius + interiorBorderWidth) * 2;

    // center white circle
    donut.append("svg:circle")
      .attr("r", circleRadius)
      .style("fill", "#ffffff");

    this.chartContainer.select(".poolIconContainer")
      .style("width", `${poolIconWidth}px`)
      .style("height", `${poolIconWidth}px`)
      .classed("interactive", this.interactive)
    ;

    this.showCenterLogo(true);

    if (this.interactive) {

      const g = donut.append("svg:g")
        .attr("class", "centerInnerCircleContainer");

      /**
       * the empty circle currounding the text
       */
      g.append("svg:circle")
        .attr("r", interiorBorderRadius)
        .attr("class", "centerInnerCircle")
        .attr("stroke-width", interiorBorderWidth)
      ;
      /**
       * the text
       */
      //const centerTextContainer =
      g.append("svg:foreignObject")
        .attr("class", "centerTextContainer")
        .attr("x", -interiorBorderInteriorRadius)
        .attr("y", -interiorBorderInteriorRadius - 6) // - 6 cause it just looks better-centered
        .attr("width", interiorBorderInteriorRadius * 2)
        .attr("height", interiorBorderInteriorRadius * 2)
      ;
    }
  }

  showCenterLogo(show = true): void {
    const container = this.chartContainer.select(".poolIconContainer");
    container.classed("show", show);
    return;
  }

  showCenterText(show = true) {
    const donut = this.donut;
    const container = donut.select(".centerInnerCircleContainer");
    container.classed("show", show);
    this.showCenterLogo(!show);
  }

  pathAnim(path, dir) {
    switch (dir) {
      case 0:
        path.transition()
          .duration(500)
          .ease("bounce")
          .attr("d", d3.svg.arc()
            .innerRadius(this.innerCircleRadius)
            .outerRadius(this.chartRadius),
          );
        break;

      case 1:
        path.transition()
          .attr("d", d3.svg.arc()
            .innerRadius(this.innerCircleRadius)
            .outerRadius(this.chartRadius * this.sliceBulgeFactor),
          );
        break;
    }
  }

  updateDonut() {

    const thisChart_r = this.chartRadius;
    const thisPathAnim = this.pathAnim.bind(this);
    const thisShowCenterText = this.showCenterText.bind(this);
    const donut = this.donut;

    const pie = d3.layout.pie()
      .sort(null)
      .value((d: IPoolTokenInfo) => {
        return d.normWeightPercentage;
      });

    const arc = d3.svg.arc()
      .innerRadius(this.innerCircleRadius)
      .outerRadius(function () {
        return (d3.select(this).classed("clicked")) ? thisChart_r * this.donutSliceExpandFactor : thisChart_r;
      });

    // Start joining data with paths
    const paths = this.donutContainer.selectAll(".donut")
      .selectAll("path")
      .data((d: Pool, _i) => {
        return pie(d.assetTokensArray);
      });

    paths
      .transition()
      .duration(1000)
      .attr("d", arc);

    const enter = paths.enter()
      .append("svg:path")
      .attr("d", arc)
      .style("fill", (_d, i) => {
        return this.colors[i];
      })
      .style("stroke", "#FFFFFF");

    if (this.interactive) {

      const thisNumberService = this.numberService;

      const eventObj = {

        "mouseover": function (_d, _i, _j) {
          const pieSlice = d3.select(this);
          const tokenInfo = pieSlice.data()[0].data as IPoolTokenInfo;
          thisPathAnim(pieSlice, 1);
          const textContainer = donut.select(".centerTextContainer");
          const toString = (num: number) => thisNumberService.toString(num,
            {
              average: false,
              mantissa: 2,
              thousandSeparated: true,
            });

          /**
           * might be better to move this into the html file, like is done with the pool icon
           */
          textContainer.html(() => {
            return `
              <div class="lines">
              <div class="line icon"><img src="${tokenInfo.icon}"/></div>
              <div class="line perc"><div class="label">${tokenInfo.symbol}</div><div class="value">${toString(tokenInfo.normWeightPercentage)}</div>%</div>
              <div class="line price"><div class="label">Price</div>$<div class="value">${toString(tokenInfo.price)}</div></div>
              <div class="line daychange">
                <div class="label">24h</div>
                <div class="signedValue ${tokenInfo.priceChangePercentage_24h < 0 ? "negative" : ""}">
                  <div class="direction"><i class="sign fas fa-caret-${tokenInfo.priceChangePercentage_24h < 0 ? "down" : "up"}"></i></div>
                  <div class="value">${toString(tokenInfo.priceChangePercentage_24h)}</div>
                </div>
                </div>
              </div>
              `;
          });

          thisShowCenterText(true);
        },

        "mouseout": function (_d, _i, _j) {
          const thisPath = d3.select(this);
          if (!thisPath.classed("clicked")) {
            thisPathAnim(thisPath, 0);
          }
          //const thisDonut = thisChartContainer.selectAll(".donut");
          thisShowCenterText(false);
        },
      };
      enter.on(eventObj);
    }

    paths.exit().remove();
  }

  public create(pool: Pool) {
    const width = parseInt(window.getComputedStyle(this.donutContainerElement).width);
    this.chartPadding = width / 2 * (this.interactive ? 0.14 : 0);
    this.chartRadius = width / 2 * (this.interactive ? 0.85 : 1);

    this.donutContainer.selectAll(".donut")
      .data([pool])
      .enter().append("svg:svg")
      .attr("width", (this.chartRadius + this.chartPadding) * 2)
      .attr("height", (this.chartRadius + this.chartPadding) * 2)
      .append("svg:g")
      .attr("class", "donut")
      .attr("transform", "translate(" + (this.chartRadius + this.chartPadding) + "," + (this.chartRadius + this.chartPadding) + ")")
    ;

    this.createCenter();

    this.updateDonut();
  }

  public update(pool: Pool) {
    this.donutContainer.selectAll(".donut")
      .data([pool])
    ;

    this.updateDonut();
  }
}
