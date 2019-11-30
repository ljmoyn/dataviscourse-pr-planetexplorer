class Scatterplot {
  /**
   * Creates a Scatterplot Object
   */
  constructor(data, dimensionMetadata, tooltip) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
    this.tooltip = tooltip;
  }

  createScatterplot(updateParallelBrushes) {
    this.updateParallelBrushes = updateParallelBrushes;
    // set the dimensions and margins of the graph
    this.margin = {
      top: 80,
      right: 60,
      bottom: 75,
      left: 80
    };
    this.width = 400;
    this.height = 400;

    // append the svg object to the body of the page
    this.svg = d3
      .select("#scatterplot")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    this.selectedX = {
      id: "distance",
      name: "Distance",
      unit: this.dimensionMetadata["distance"].unit
    };
    this.selectedY = {
      id: "mass",
      name: "Mass",
      unit: this.dimensionMetadata["mass"].unit
    };

    // Return all possible options (discrete and continuous)
    this.dimensions = d3.keys(this.dimensionMetadata).filter(
      function(dimension) {
        return this.dimensionMetadata[dimension].hidden !== true;
      }.bind(this)
    );

    this.dimensions.sort(
      function(a, b) {
        return this.dimensionMetadata[a].order > this.dimensionMetadata[b].order
          ? 1
          : -1;
      }.bind(this)
    );

    let self = this;

    // List of variables in x-axis dropdown
    this.xLabels = self.dimensions.filter(function(dim) {
      return self.dimensionMetadata[dim].discrete === undefined;
    });

    // List of variables the same in y-axis
    this.yLabels = this.xLabels;

    // Find max x value for scale
    let xMax = d3.max(this.data.map(d => d[this.selectedX.id]));

    // Find max y value for scale
    let yMax = d3.max(this.data.map(d => d[this.selectedY.id]));

    // Add Y axis
    this.yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([this.height, 0]);
    this.svg.append("g").attr("id", "yAxis");
    //.call(d3.axisLeft(this.yScale));
    this.svg
      .append("text")
      .attr("id", "yLabel")
      .attr(
        "transform",
        "translate(-45" + " ," + this.height / 2 + ") " + "rotate(-90)"
      )
      .style("text-anchor", "middle");

    //Add x axis
    this.xScale = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([0, this.width]);
    this.svg
      .append("g")
      .attr("id", "xAxis")
      .attr("transform", "translate(0," + this.height + ")");
    this.svg
      .append("text")
      .attr("id", "xLabel")
      .attr(
        "transform",
        "translate(" +
          this.width / 2 +
          " ," +
          (this.height + this.margin.top - 10) +
          ")"
      )
      .style("text-anchor", "middle");

    // let options = this.dimensions.filter(
    //   function(dim) {
    //     return self.dimensionMetadata[dim].order > 1;
    //   }.bind(this)
    // );
    let target = d3.select("#scatterplot");
    let dropdownX = new Dropdown(
      target,
      40,
      0,
      300,
      35,
      this.xLabels,
      "distance",
      this.dimensionMetadata,
      "12px",
      "scatterX",
      "Select X-Axis"
    );

    dropdownX.select.on(
      "change",
      function(previousDim, num, target) {
        // Set selected x in dropdown
        this.selectedX = {
          id: target[0].value,
          name:
            target[0].value.charAt(0).toUpperCase() + target[0].value.slice(1), // Make upper case
          unit: this.dimensionMetadata[target[0].value].unit
        };
        this.updateScatterplot();
      }.bind(this)
    );

    let dropdownY = new Dropdown(
      target,
      40,
      35,
      300,
      35,
      this.yLabels,
      "mass",
      this.dimensionMetadata,
      "12px",
      "scatterY",
      "Select Y-Axis"
    );

    dropdownY.select.on(
      "change",
      function(previousDim, num, target) {
        // Set selected x in dropdown
        this.selectedY = {
          id: target[0].value,
          name:
            target[0].value.charAt(0).toUpperCase() + target[0].value.slice(1), // Make upper case
          unit: this.dimensionMetadata[target[0].value].unit
        };
        this.updateScatterplot();
      }.bind(this)
    );

    this.brush = d3
      .brush()
      .extent([
        [this.xScale.range()[0] - 5, this.yScale.range()[1] - 5],
        [this.xScale.range()[1] + 5, this.yScale.range()[0] + 5]
      ])
      .on(
        "brush end",
        function() {
          this.brushChange(true);
        }.bind(this)
      );
    this.svg
      .append("g")
      .classed("brush", true)
      .call(this.brush);
    this.pointGroup = this.svg.append("g");

    this.updateScatterplot();
  }

  updateScatterplot() {
    this.xScale = d3
      .scaleLinear()
      .domain(
        d3.extent(
          this.data,
          function(datum) {
            return +datum[this.selectedX.id];
          }.bind(this)
        )
      )
      .range([0, this.width]);

    this.svg.select("#xAxis").call(d3.axisBottom(this.xScale));

    d3.select("#xLabel").text(
      this.selectedX.name +
        (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
    );

    this.yScale = d3
      .scaleLinear()
      .domain(
        d3.extent(
          this.data,
          function(datum) {
            return +datum[this.selectedY.id];
          }.bind(this)
        )
      )
      .range([this.height, 0]);

    this.svg.select("#yAxis").call(d3.axisLeft(this.yScale));

    this.svg
      .select("#yLabel")
      .text(
        this.selectedY.name +
          (this.selectedY.unit ? " (" + this.selectedY.unit + ")" : "")
      );

    this.plotPoints = this.pointGroup.selectAll("circle").data(this.data);
    this.plotPoints
      .transition()
      .duration(1000)
      //update positions of existing dots
      .attr("cx", d => this.xScale(d[this.selectedX.id]))
      .attr("cy", d => this.yScale(d[this.selectedY.id]));

    // Add dots
    let self = this;
    this.plotPoints
      .enter()
      .append("circle")
      .attr("cx", d => this.xScale(d[this.selectedX.id]))
      .attr("cy", d => this.yScale(d[this.selectedY.id]))
      .attr("stroke", "black")
      .attr("stroke-width", 0)
      .attr("r", 2)
      .style("fill", "#69b3a2")
      // Add hover capabilities
      .on("mouseover", function(d) {
        self.tooltip.show(
          "<h5> Name: " +
            d.name +
            "</h5>" +
            "<h5> Facility: " +
            d.facility +
            "</h5>"
        );
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("r", 3);
      })
      .on("mouseout", function(d) {
        self.tooltip.hide();
        d3.select(this)
          .attr("stroke-width", 0)
          .attr("r", 2);
      });

    this.plotPoints.exit().remove();
  }

  brushChange(userTriggered) {
    let self = this;
    let yDimension = this.selectedY.id;
    let xDimension = this.selectedX.id;
    let extent = d3.event.selection;

    this.pointGroup
      .selectAll("circle")
      .data(this.data)
      .classed("activePoint", function(datum) {
        if (extent === null) return false;

        let withinBrush =
          extent[0][1] <= self.yScale(datum[yDimension]) &&
          self.yScale(datum[yDimension]) <= extent[1][1] &&
          extent[0][0] <= self.xScale(datum[xDimension]) &&
          self.xScale(datum[xDimension]) <= extent[1][0];

        return withinBrush;
      });

    //need the extent in terms of the data, so it can be used with the scale
    let dataExtent = this.getDataExtent(extent);

    //need to know if the brush event was triggered by user action or programmatically
    //Programmatically won't have an screen coordinates.
    //Can get into infinite recursive calls of events without this check.
    if (
      d3.event.sourceEvent.screenX &&
      d3.event.sourceEvent.screenX !== 0 &&
      d3.event.sourceEvent.screenY &&
      d3.event.sourceEvent.screenY !== 0
    )
      this.updateParallelBrushes(xDimension, yDimension, dataExtent);
  }

  updateBrushFromParallel(dataExtents) {
    let brush = this.svg.select(".brush");
    if (!dataExtents) {
      brush.call(this.brush.move, null);
      return;
    }

    let newBrushExtent = [
      [-5, -5],
      [this.width + 5, this.height + 5]
    ];
    for (let key in dataExtents) {
      if (key === this.selectedX.id) {
        newBrushExtent[0][0] = this.xScale(dataExtents[key][1]);
        newBrushExtent[1][0] = this.xScale(dataExtents[key][0]);
      }
      if (key === this.selectedY.id) {
        newBrushExtent[0][1] = this.yScale(dataExtents[key][0]);
        newBrushExtent[1][1] = this.yScale(dataExtents[key][1]);
      }
    }

    this.svg.select(".brush").call(this.brush.move, newBrushExtent);
  }

  getDataExtent(extent) {
    return extent !== null && extent !== undefined
      ? [
          [this.xScale.invert(extent[0][0]), this.yScale.invert(extent[0][1])],
          [this.xScale.invert(extent[1][0]), this.yScale.invert(extent[1][1])]
        ]
      : null;
  }

  filterByBrushes() {
    let brush = this.svg.select(".brush");
    let extent = d3.brushSelection(brush.node()); // [[32.29999923706055,158.1999969482422],[250.3000030517578,364.20001220703125]]//d3.brushSelection(brush);

    if (!extent) return;
    let dataExtent = this.getDataExtent(extent);

    let xDimension = this.selectedX.id;
    let yDimension = this.selectedY.id;
    this.data = this.data.filter(
      function(datum) {
        return (
          datum[xDimension] >= dataExtent[0][0] &&
          datum[xDimension] <= dataExtent[1][0] &&
          datum[yDimension] >= dataExtent[1][1] &&
          datum[yDimension] <= dataExtent[0][1]
        );
      }.bind(this)
    );

    brush.call(this.brush.move, null);

    this.updateScatterplot();
  }

  clearFilter(completeData) {
    this.data = completeData;
    this.updateScatterplot();
  }
}
