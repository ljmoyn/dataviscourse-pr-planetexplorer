class Scatterplot {
  /**
   * Creates a Scatterplot Object
   */
  constructor(data) {
    this.data = data;
  }

  createScatterplot() {
    // set the dimensions and margins of the graph
    (this.margin = { top: 10, right: 20, bottom: 50, left: 60 }),
      (this.width = 460 - this.margin.left - this.margin.right),
      (this.height = 460 - this.margin.top - this.margin.bottom);

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

    this.updateScatterplot();
  }

  updateScatterplot() {
    // Find max x value for scale
    let xMax = d3.max(this.data.map(d => d.distance));

    // Find max y value for scale
    let yMax = d3.max(this.data.map(d => d.mass));

    // Add X axis
    // x-axis is planet distance
    let x = d3
      .scaleLinear()
      .domain([0, xMax])
      .range([0, this.width]);
    this.svg
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(x));
    this.svg
      .append("text")
      .attr(
        "transform",
        "translate(" +
          this.width / 2 +
          " ," +
          (this.height + this.margin.top + 20) +
          ")"
      )
      .style("text-anchor", "middle")
      .text("Distance (parsecs)");

    // Add Y axis
    // y-axis is planet mass
    let y = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([this.height, 0]);
    this.svg
      .append("g")
      .text("Mass")
      .call(d3.axisLeft(y));
    this.svg
      .append("text")
      .attr(
        "transform",
        "translate(-25" + " ," + this.height / 2 + ") " + "rotate(-90)"
      )
      .style("text-anchor", "middle")
      .text("Mass (Jupiter Mass)");

    // Initiate hover
    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add dots
    this.svg
      .append("g")
      .selectAll("circle")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.distance))
      .attr("cy", d => y(d.mass))
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
              d.name +
              "</h5>" +
              "<h5> Facility: " +
              d.facility +
              "</h5>"
          )
          .style("left", d3.event.pageX + 28 + "px")
          .style("top", d3.event.pageY - 28 + "px");
        d3.select(this)
          .attr("stroke", "black")
          .attr("r");
      })
      .on("mouseout", function(d) {
        div
          .transition()
          .duration(500)
          .style("opacity", 0);
        d3.select(this)
          .attr("stroke", "#69b3a2")
          .attr("stroke-width", 1);
      });
  }
}
