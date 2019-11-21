class Violin {
  /**
   * Creates a Scatterplot Object
   */
  constructor(data, dimensionMetadata) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
  }

  createViolin() {
    // set the dimensions and margins of the graph
    this.margin = { top: 10, right: 100, bottom: 100, left: 150 };
    this.width = 1000;
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

    this.pointGroup = this.svg.append("g");

    this.selectedX = {
      id: "discoveryMethod",
      name: "Discovery Method",
      unit: this.dimensionMetadata["discoveryMethod"].unit
    };

    this.selectedY = {
      id: "distance",
      name: "Distance",
      unit: this.dimensionMetadata["distance"].unit
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

    // Hardcoded x-axis as "Discovery Method"
    this.xLabels = d3
      .map(this.data, function(d) {
        return d.discoveryMethod;
      })
      .keys();

    //Add x axis
    this.xScale = d3
      .scaleBand()
      .range([0, this.width])
      .domain(this.xLabels)
      .padding(0.05);
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
          (this.height + this.margin.top + 60) +
          ")" +
          ""
      )
      .style("text-anchor", "middle")
      .text(
        this.selectedX.name +
          (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
      );

    this.updateViolin();
  }

  updateViolin() {
    // Set x-axis
    d3.select("#xAxis")
      .call(d3.axisBottom(this.xScale))
      .selectAll("text")
      .attr(
        "transform",
        "rotate(" +
          (this.dimensionMetadata[this.selectedX.id].longLabels ? 20 : 0) +
          ")"
      )
      .style("text-anchor", "start");
    d3.select("#xLabel").text(
      this.selectedX.name +
        (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : "")
    );

    // Features of the histogram
    let histogram = d3
      .histogram()
      .domain(this.yScale.domain())
      .thresholds(this.yScale.ticks(40)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
      .value(d => d);

    // Compute the binning for each group of the dataset
    let sumstat = d3
      .nest() // nest function allows to group the calculation per level of a factor
      .key(function(d) {
        return d.discoveryMethod;
      })
      .rollup(function(d) {
        // For each key..
        let input = d.map(function(g) {
          return g.distance;
        }); // Keep the variable called distance
        let bins = histogram(input); // And compute the binning on it.
        return bins;
      })
      .entries(this.data);

    let xNums = {};

      for(let i = 0; i < sumstat.length; i++)
      {
        let maxNum = 0;
        let allBins = sumstat[i].value;
        let lengths = allBins.map(function(a) {
          return a.length;
        });
        let longest = d3.max(lengths);
        if (longest > maxNum) {
          maxNum = longest;
        }
        let test = ""
        for(let j = 0; j < sumstat[i].value.length; j++){
          sumstat[i].value[j].scale = d3
            .scaleLinear()
            .range([0, this.xScale.bandwidth()])
            .domain([-maxNum, maxNum]);
        }


      }

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
        return d.value
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
  }
}
