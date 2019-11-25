class Scatterplot {
  /**
   * Creates a Scatterplot Object
   */
  constructor(data, dimensionMetadata, tooltip) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
    this.tooltip = tooltip;
  }

  createScatterplot() {
    // set the dimensions and margins of the graph
    this.margin = { top: 80, right: 100, bottom: 100, left: 150 };
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

    this.pointGroup = this.svg.append("g");

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

    this.dimensions = d3.keys(this.dimensionMetadata).filter(
      function(dimension) {
        return this.dimensionMetadata[dimension].order >= 0;
      }.bind(this)
    );

    this.dimensions.sort(
      function(a, b) {
        return this.dimensionMetadata[a].order > this.dimensionMetadata[b].order
          ? 1
          : -1;
      }.bind(this)
    );

    // Find max x value for scale
    let xMax = d3.max(this.data.map(d => d[this.selectedX.id]));

    // Find max y value for scale
    let yMax = d3.max(this.data.map(d => d[this.selectedY.id]));

    // Add Y axis
    this.yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([this.height, 0]);
    this.svg
      .append("g")
      .attr("id", "yAxis")
      .call(d3.axisLeft(this.yScale));
    this.svg
      .append("text")
      .attr("id", "yLabel")
      .attr(
        "transform",
        "translate(-45" + " ," + this.height / 2 + ") " + "rotate(-90)"
      )
      .style("text-anchor", "middle")
      .text(
        this.selectedY.name +
          (this.selectedY.unit ? " (" + this.selectedY.unit + ")" : "")
      );

    //Add x axis
    this.xScale = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([0, this.width]);
    this.svg
      .append("g")
      .attr("id", "xAxis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.xScale));
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
      .style("text-anchor", "middle")
      .text(
        this.selectedX.name +
          (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
      );

    let self = this;

    d3.select("#scatterplot")
      .append("text")
      .attr("y", 24)
      .attr("x", 10)
      .attr("font-size", 12)
      .text("Select x-axis:");

    d3.select("#scatterplot")
      .append("text")
      .attr("y", 64)
      .attr("x", 10)
      .attr("font-size", 12)
      .text("Select y-axis:");

    let dropdownX = d3
      .select("#scatterplot")
      .append("foreignObject")
      .attr("y", 10)
      .attr("x", 120)
      .attr("width", 200)
      .attr("height", 30)
      .attr("font-size", 12)
      .append("xhtml:div")
      .append("select")
      .classed("axisDropdown2", true);
    dropdownX
      .selectAll("option")
      .data(
        self.dimensions.filter(function(dim) {
          return self.dimensionMetadata[dim].order > 1;
        })
      )
      .enter()
      .append("option")
      .text(function(dim) {
        let dimensionUnit = self.dimensionMetadata[dim].unit;
        let dimensionName = dim.charAt(0).toUpperCase() + dim.slice(1);
        return (
          dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "")
        );
      })
      .attr("value", function(dim) {
        return dim;
      });

    let dropdownY = d3
      .select("#scatterplot")
      .append("foreignObject")
      .attr("y", 50)
      .attr("x", 120)
      .attr("width", 200)
      .attr("height", 30)
      .append("xhtml:div")
      .append("select")
      .classed("axisDropdown2", true);
    dropdownY
      .selectAll("option")
      .data(
        self.dimensions.filter(function(dim) {
          return self.dimensionMetadata[dim].order > 1;
        })
      )
      .enter()
      .append("option")
      .text(function(dim) {
        let dimensionUnit = self.dimensionMetadata[dim].unit;
        let dimensionName = dim.charAt(0).toUpperCase() + dim.slice(1);
        return (
          dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "")
        );
      })
      .attr("value", function(dim) {
        return dim;
      });

    this.updateScatterplot();
  }

  updateScatterplot() {
    // Find max x value for scale

    let values = this.data.map(datum => datum[this.selectedX.id]);
    // Find max y value for scale
    let xMax = d3.max(this.data.map(d => d[this.selectedX.id]));
    this.xScale = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([0, this.width]);

    d3.select("#xAxis")
      .call(d3.axisBottom(this.xScale))
      .selectAll("text")
      .style("text-anchor", "start");

    d3.select("#xLabel").text(
      this.selectedX.name +
        (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
    );

    values = this.data.map(datum => datum[this.selectedY.id]);
    let yMax = d3.max(this.data.map(d => d[this.selectedY.id]));
    this.yScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([this.height, 0]);

    d3.select("#yAxis").call(d3.axisLeft(this.yScale));
    d3.select("#yLabel").text(
      this.selectedY.name +
        (this.selectedY.unit ? " (" + this.selectedY.unit + ")" : "")
    );

    let plotPoints = this.pointGroup.selectAll("circle").data(this.data);

    plotPoints
      .transition()
      .duration(1000)
      //update positions of existing dots
      .attr("cx", d => this.xScale(d[this.selectedX.id]))
      .attr("cy", d => this.yScale(d[this.selectedY.id]));

    // Add dots
    let self = this;
    plotPoints
      .enter()
      .append("circle")
      .attr("cx", d => this.xScale(d[this.selectedX.id]))
      .attr("cy", d => this.yScale(d[this.selectedY.id]))
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1)
      .attr("r", 1.2)
      .style("fill", "#69b3a2")
      // Add hover capabilities
      .on("mouseover", function(d) {
        self.tooltip.show("<h5> Name: " +
          d.name +
          "</h5>" +
          "<h5> Facility: " +
          d.facility +
          "</h5>");
        d3.select(this)
          .attr("stroke", "black")
          .attr("r", 3);
      })
      .on("mouseout", function(d) {
        self.tooltip.hide();
        d3.select(this)
          .attr("stroke", "#69b3a2")
          .attr("r", 1.2);
      });

    plotPoints.exit().remove();
  }
}
