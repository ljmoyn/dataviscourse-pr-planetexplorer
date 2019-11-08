class Scatterplot {
  /**
   * Creates a Scatterplot Object
   */
  constructor(data) {
    this.data = data;
  }

  createScatterplot() {
    // set the dimensions and margins of the graph
    this.margin = { top: 10, right: 100, bottom: 100, left: 150 }
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
        id:"distance",
      name: "Distance",
      unit: "Parsecs"
    };
    this.selectedY = {
        id: "mass",
      name: "Mass",
      unit: "Jupiter Masses"
    };

    // Find max x value for scale
    let xMax = d3.max(this.data.map(d => d[this.selectedX.id].value));

    // Find max y value for scale
    let yMax = d3.max(this.data.map(d => d[this.selectedY.id].value));

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
      .attr("id","yLabel")
      .attr(
        "transform",
        "translate(-45" + " ," + this.height / 2 + ") " + "rotate(-90)"
      )
      .style("text-anchor", "middle")
      .text(this.selectedY.name + (this.selectedY.unit ? " (" + this.selectedY.unit + ")" : ""));

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
          (this.height + this.margin.top + 20) +
          ")"
      )
      .style("text-anchor", "middle")
      .text(this.selectedX.name + (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : ""));

      this.updateScatterplot();
  }

  updateScatterplot() {
    // Find max x value for scale

    let values = this.data.map(datum => datum[this.selectedX.id]);
    // Find max y value for scale
    if(values.some(v => isNaN(v.value)))
    {
        let uniqueValues = values.map(v => v.value);
        uniqueValues = uniqueValues.filter(function(v, i) {return uniqueValues.indexOf(v) == i;});
        uniqueValues.sort();

        this.xScale = d3.scalePoint()
                   .domain(uniqueValues)
                   .range([0,this.width]);
    }
    else
    {
        let xMax = d3.max(this.data.map(d => d[this.selectedX.id].value));
        this.xScale = d3.scaleLinear()
                   .domain([0, xMax])
                   .range([0, this.width]);
    }
    d3.select("#xAxis").call(d3.axisBottom(this.xScale)).selectAll("text")
    .attr("transform", "rotate(" + (this.data[0][this.selectedX.id].longLabels ? 20 : 0) + ")")
    .style("text-anchor", "start");
    d3.select("#xLabel").text(this.selectedX.name + (this.selectedX.unit ? " (" + this.selectedX.unit + ")" : ""))

    values = this.data.map(datum => datum[this.selectedY.id]);
    if(values.some(v => isNaN(v.value)))
    {
        let uniqueValues = values.map(v => v.value);
        uniqueValues = uniqueValues.filter(function(v, i) {return uniqueValues.indexOf(v) == i;});
        uniqueValues.sort();

        this.yScale = d3.scalePoint()
                   .domain(uniqueValues)
                   .range([this.height, 0]);
    }
    else{
        let yMax = d3.max(this.data.map(d => d[this.selectedY.id].value));
        this.yScale = d3.scaleLinear()
                   .domain([0, yMax])
                   .range([this.height, 0]);
    }
    d3.select("#yAxis").call(d3.axisLeft(this.yScale));
    d3.select("#yLabel").text(this.selectedY.name + (this.selectedY.unit ? " (" + this.selectedY.unit + ")" : ""))

    // Initiate hover
    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    let plotPoints = this.pointGroup
      .selectAll("circle")
      .data(this.data)

    plotPoints.transition()
      .duration(1000)
      //update positions of existing dots
      .attr("cx", d => this.xScale(d[this.selectedX.id].value))
      .attr("cy", d => this.yScale(d[this.selectedY.id].value))

     // Add dots
     plotPoints.enter()
      .append("circle")
      .attr("cx", d => this.xScale(d[this.selectedX.id].value))
      .attr("cy", d => this.yScale(d[this.selectedY.id].value))
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1)
      .attr("r", 1.2)
      .style("fill", "#69b3a2")
      // Add hover capabilities
      .on("mouseover", function(d) {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .html(
            "<h5> Name: " +
              d.name.value +
              "</h5>" +
              "<h5> Facility: " +
              d.facility.value +
              "</h5>"
          )
          .style("left", d3.event.pageX + 28 + "px")
          .style("top", d3.event.pageY - 28 + "px");
        d3.select(this)
          .attr("stroke", "black")
          .attr("r", 3);
      })
      .on("mouseout", function(d) {
        div
          .transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this)
          .attr("stroke", "#69b3a2")
          .attr("r", 1.2);
      });

      plotPoints.exit().remove()
  }
}
