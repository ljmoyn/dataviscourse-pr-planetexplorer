class ParallelAxes {

  constructor(data, updateScatterAxes) {
    this.data = data.slice(0, 10);
    this.updateScatterAxes = updateScatterAxes;
    this.margin = {
      top: 80,
      right: 20,
      bottom: 35,
      left: 20
    };

    this.width = 800;
    this.height = 400;
    this.svg = d3.select("#parallelAxes")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)

    this.xScale = d3.scalePoint().rangeRound([0, this.width]).padding(1);
    this.yScales = {};

    this.dimensions = d3.keys(this.data[0]).filter(function(k) {
      return k !== "name" && k !== "facility" && k !== "discoveryMethod" && k !== "lastUpdate"
    });

    this.selectedX = "distance";
    this.selectedY = "mass";

    this.xScale.domain(this.dimensions);
    //http://plnkr.co/edit/dCNuBsaDNBwr7CrAJUBe?p=preview
    for (let i = 0; i < this.dimensions.length; i++) {
      let dimension = this.dimensions[i];
      let values = this.data.map(function(datum) {
        return datum[dimension];
      });
      this.yScales[dimension] = d3.scaleLinear()
        .domain(d3.extent(this.data, function(datum) {
          return +datum[dimension];
        }))
        .range([this.height, 0])
    }

    this.linesGroup = this.svg.append("g")
      .attr("class", "linesGroup")
      .attr("transform", "translate(0," + this.margin.top + ")")
      .selectAll("path")
      .data(this.data)
      .enter().append("path")
      .attr("d", this.getPath.bind(this));

    let self = this;
    this.svg.selectAll(".dimension")
      .data(this.dimensions)
      .enter().append("g")
      .attr("class", "dimension axis")
      .attr("transform", function(d) {
        return "translate(" + self.xScale(d) + "," + self.margin.top + ")";
      })
      .each(function(dimension) {
        //add axis to the group
        d3.select(this).call(d3.axisLeft(self.yScales[dimension]));

        //add axis label at top
        d3.select(this).append("text")
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .attr("y", -65)
          .text(function(d) {
            return d;
          });
        d3.select(this).append("foreignObject")
          .attr("y", -30)
          .attr("x", -25)
          .attr("width", 50)
          .attr("height", 25)
          .append("xhtml:div")
          .append("button")
          .attr("type","button")
          .classed("buttonY",true)
          .classed("selectedButton", self.selectedY === dimension)
          .html("Set Y")
          .on("click", function(){
              self.selectedY = dimension;
              self.updateScatterAxes(null, dimension)
              self.svg.selectAll(".buttonY").classed("selectedButton", false)
              d3.select(this).classed("selectedButton", true)
          });
        d3.select(this).append("foreignObject")
          .attr("y", -55)
          .attr("x", -25)
          .attr("width", 50)
          .attr("height", 25)
          .append("xhtml:div")
          .append("button")
          .attr("type","button")
          .classed("buttonX",true)
          .classed("selectedButton", self.selectedX === dimension)
          .html("Set X")
          .on("click", function(){
              self.selectedX = dimension;
              self.updateScatterAxes(dimension)
              self.svg.selectAll(".buttonX").classed("selectedButton", false)
              d3.select(this).classed("selectedButton", true)
          });
      })
  }

  update(){


  }

  getPath(datum) {
    let self = this;
    return d3.line()(this.dimensions.map(function(dimension) {
      return [self.xScale(dimension), self.yScales[dimension](datum[dimension])];
    }))
  }
}
