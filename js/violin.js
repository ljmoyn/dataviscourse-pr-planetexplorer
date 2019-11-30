class Violin {
  /**
   * Creates a Scatterplot Object
   */
  constructor(data, dimensionMetadata) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
  }

  createViolin() {
    // Create initial violin
    // Will be updated with updateViolin() on click for dropdown
    // set the dimensions and margins of the graph
    this.margin = { top: 80, right: 70, bottom: 100, left: 80 };
    this.width = 1050;
    this.height = 400;

    // append the svg object to the body of the page
    this.svg = d3
      .select("#violin")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    // Get all possible options for both drop downs
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

    // // Text to prompt x-axis dropdown
    // d3.select("#violin")
    //   .append("text")
    //   .attr("y", 24)
    //   .attr("x", 10)
    //   .attr("font-size", 12)
    //   .text("Select x-axis:");

    // // Text to prompt y-axis dropdown
    // d3.select("#violin")
    //   .append("text")
    //   .attr("y", 64)
    //   .attr("x", 10)
    //   .attr("font-size", 12)
    //   .text("Select y-axis:");

    // List of variables in x-axis dropdown
    this.xLabels = self.dimensions.filter(function(dim) {
      return self.dimensionMetadata[dim].discrete === true;
    });

    // List of variables in y-axis dropdown
    this.yLabels = self.dimensions.filter(function(dim) {
      return self.dimensionMetadata[dim].discrete === undefined;
    });

    // Make dropdown for x-axis
    // let dropdownX = d3
    //   .select("#violin")
    //   .append("foreignObject")
    //   .attr("y", 10)
    //   .attr("x", 120)
    //   .attr("width", 200)
    //   .attr("height", 30)
    //   .attr("font-size", 12)
    //   .append("xhtml:div")
    //   .append("select")
    //   .classed("axisDropdown2", true);
    // dropdownX
    //   .selectAll("option")
    //   .data(this.xLabels)
    //   .enter()
    //   .append("option")
    //   .text(function(dim) {
    //     let dimensionUnit = self.dimensionMetadata[dim].unit;
    //     let dimensionName = dim.charAt(0).toUpperCase() + dim.slice(1);
    //     return (
    //       dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "")
    //     );
    //   })
    //   .attr("value", function(dim) {
    //     return dim;
    //   });

    // Initialize x-axis choice
    this.myX = this.xLabels[0];

    let target = d3.select("#violin");
    let dropdownX = new Dropdown(
      target,
      40,
      0,
      300,
      35,
      this.xLabels,
      "discoveryLocale",
      this.dimensionMetadata,
      "12px",
      "violinX",
      "Select X-Axis"
    );

    dropdownX.select.on(
      "change",
      function(previousDim, num, target) {
        this.updateViolin();
      }.bind(this)
    );

    // Initialize y-axis choice
    this.myY = this.yLabels[0];

    // Make y-axis dropdown
    let dropdownY = new Dropdown(
      target,
      40,
      35,
      300,
      35,
      this.yLabels,
      "declination",
      this.dimensionMetadata,
      "12px",
      "violinY",
      "Select Y-Axis"
    );

    dropdownY.select.on(
      "change",
      function(previousDim, num, target) {
        this.myY = target[0].value;
        this.updateViolin();
      }.bind(this)
    );

    // // Make dropdown for y-axis
    // let dropdownY = d3
    //   .select("#violin")
    //   .append("foreignObject")
    //   .attr("y", 50)
    //   .attr("x", 120)
    //   .attr("width", 200)
    //   .attr("height", 30)
    //   .append("xhtml:div")
    //   .append("select")
    //   .classed("axisDropdown2", true);
    // dropdownY
    //   .selectAll("option")
    //   .data(this.yLabels)
    //   .enter()
    //   .append("option")
    //   .text(function(dim) {
    //     let dimensionUnit = self.dimensionMetadata[dim].unit;
    //     let dimensionName = dim.charAt(0).toUpperCase() + dim.slice(1);
    //     return (
    //       dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "")
    //     );
    //   })
    //   .attr("value", function(dim) {
    //     return dim;
    //   });

    // // Initialize y-axis choice
    // this.myY = this.yLabels[0];

    // dropdownY.on(
    //   "change",
    //   function(previousDim, num, target) {
    //     this.myY = target[0].value;
    //     this.updateViolin();
    //   }.bind(this)
    // );

    this.updateViolin();
  }

  updateViolin() {
    // Set selected x in dropdown
    this.selectedX = {
      id: this.myX,
      name: this.myX.charAt(0).toUpperCase() + this.myX.slice(1), // Make upper case
      unit: this.dimensionMetadata[this.myX].unit
    };

    // Set selected y in dropdown
    this.selectedY = {
      id: this.myY,
      name: this.myY.charAt(0).toUpperCase() + this.myY.slice(1), // Make upper case
      unit: this.dimensionMetadata[this.myY].unit
    };

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

    // Set y-axis
    this.svg
      .select("#yAxis")
      .selectAll("text")
      .attr(
        "transform",
        "rotate(" +
          (this.dimensionMetadata[this.selectedY.id].longLabels ? 30 : 0) +
          ")"
      )
      .style("text-anchor", "start");
    this.svg
      .select("#xLabel")
      .text(
        this.selectedX.name +
          (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
      );

    // Discrete ticks on x-axis
    this.xTickLabels = d3
      .map(
        this.data,
        function(d) {
          return d[this.selectedX.id];
        }.bind(this)
      )
      .keys();

    //Add x axis
    this.xScale = d3
      .scaleBand()
      .range([0, this.width])
      .domain(this.xTickLabels)
      .padding(0.05);
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
          (this.height + this.margin.top) +
          ")" +
          ""
      )
      .style("text-anchor", "middle")
      .text(
        this.selectedX.name +
          (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
      );

    // Features of the histogram
    let histogram = d3
      .histogram()
      .domain(this.yScale.domain())
      .thresholds(this.yScale.ticks(30)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
      .value(d => d);

    // Compute the binning for each group of the dataset
    let sumstat = d3
      .nest() // nest function allows to group the calculation per level of a factor
      .key(
        function(d) {
          return d[this.selectedX.id];
        }.bind(this)
      )
      .rollup(
        function(d) {
          // For each key..
          let input = d.map(
            function(g) {
              return g[this.selectedY.id];
            }.bind(this)
          ); // Keep the variable called distance
          let bins = histogram(input); // And compute the binning on it.
          return bins;
        }.bind(this)
      )
      .entries(this.data);

    for (let i = 0; i < sumstat.length; i++) {
      let maxNum = 0;
      let allBins = sumstat[i].value;
      let lengths = allBins.map(function(a) {
        return a.length;
      });
      let longest = d3.max(lengths);
      if (longest > maxNum) {
        maxNum = longest;
      }
      for (let j = 0; j < sumstat[i].value.length; j++) {
        sumstat[i].value[j].scale = d3
          .scaleLinear()
          .range([0, this.xScale.bandwidth()])
          .domain([-maxNum, maxNum]);
      }
      sumstat[i].size = d3.sum(lengths);
    }

    // Sort x labels by number of entries
    sumstat.sort((a, b) => (a.size < b.size ? 1 : -1));

    this.xScale.domain(
      sumstat.map(function(d) {
        return d.key;
      })
    );

    // Set x-axis
    this.svg
      .select("#xAxis")
      .call(d3.axisBottom(this.xScale))
      .selectAll("text")
      .attr(
        "transform",
        "rotate(" +
          (this.dimensionMetadata[this.selectedX.id].longLabels ? 30 : 0) +
          ")"
      )
      .style("text-anchor", "start");
    this.svg
      .select("#xLabel")
      .text(
        this.selectedX.name +
          (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
      );

    // Add the shape to this svg!
    this.svg
      .selectAll("myViolin")
      .data(sumstat)
      .enter() // So now we are working group per group
      .append("g")
      .attr(
        "transform",
        function(d) {
          return "translate(" + this.xScale(d.key) + " ,0)";
        }.bind(this)
      ) // Translation on the right to be at the group position
      .append("path")
      .datum(function(d) {
        return d.value;
      })
      .style("stroke", "none")
      .style("fill", "#69b3a2")
      .attr(
        "d",
        d3
          .area()
          .x0(function(d) {
            return d.scale(-d.length);
          })
          .x1(function(d) {
            return d.scale(d.length);
          })
          .y(
            function(d) {
              return this.yScale(d.x0);
            }.bind(this)
          )
          .curve(d3.curveCatmullRom) // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
      );

    this.svg
      .select("#violin")
      .exit()
      .remove();

    console.log(sumstat);
  }
}
