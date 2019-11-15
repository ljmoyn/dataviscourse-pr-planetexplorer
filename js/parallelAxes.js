class ParallelAxes {
  constructor(data, updateScatterAxes) {
    this.data = data;
    this.updateScatterAxes = updateScatterAxes;
    this.margin = {
      top: 80,
      right: 20,
      bottom: 35,
      left: 20
    };

    this.width = 2000;
    this.height = 400;
    this.svg = d3
      .select("#parallelAxes")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.dimensions = d3.keys(this.data[0]).filter(function(dimension) {
      return (
        dimension !== "name" && dimension !== "id" && dimension !== "lastUpdate"
      );
    });
    this.dimensions.sort();

    this.selectedX = {
      id: "distance",
      name: "Distance",
      unit: "Parsecs"
    };
    this.selectedY = {
      id: "mass",
      name: "Mass",
      unit: "Jupiter Masses"
    };

    this.xScale = d3
      .scalePoint()
      .domain(this.dimensions)
      .rangeRound([0, this.width])
      .padding(0.25);
    this.yScales = {};

    //http://plnkr.co/edit/dCNuBsaDNBwr7CrAJUBe?p=preview
    //initialize yScales, which is an object containing scales for each dimension
    let self = this;
    for (let i = 0; i < this.dimensions.length; i++) {
      let dimension = this.dimensions[i];
      let values = this.data.map(function(datum) {
        return datum[dimension];
      });
      //non-numerical data needs a different type of scale
      if (values.some(v => isNaN(v.value))) {
        let uniqueValues = values.map(v => v.value);
        uniqueValues = uniqueValues.filter(function(v, i) {
          return uniqueValues.indexOf(v) == i;
        });
        if (dimension === "facility" || dimension === "discoveryMethod") {
          uniqueValues.sort(function(a, b) {
            let aCount = 0;
            let bCount = 0;
            for (let i = 0; i < self.data.length; i++) {
              if (self.data[i][dimension].value === a) aCount++;
              if (self.data[i][dimension].value === b) bCount++;
            }

            if (aCount === bCount) return 0;

            return aCount > bCount ? 1 : -1;
          });
        } else {
          uniqueValues.sort();
        }
        this.yScales[dimension] = d3
          .scalePoint()
          .domain(uniqueValues)
          .range([this.height, 0], 1);
      } else {
        this.yScales[dimension] = d3
          .scaleLinear()
          .domain(
            d3.extent(this.data, function(datum) {
              return +datum[dimension].value;
            })
          )
          .range([this.height, 0]);
      }
    }

    this.linesGroup = this.svg
      .append("g")
      .attr("class", "linesGroup")
      .attr("transform", "translate(0," + this.margin.top + ")")
      .selectAll("path")
      .data(this.data)
      .enter()
      .append("path")
      .attr("d", this.getPath.bind(this));

    this.dimensionGroups = this.svg
      .selectAll(".dimension")
      .data(this.dimensions);
    self = this;
    this.createDragEvents();
    this.dimensionGroups
      .enter()
      .append("g")
      .attr("class", "dimension axis")
      .attr("transform", function(d) {
        return "translate(" + self.xScale(d) + "," + self.margin.top + ")";
      })
      //apply drag events to the groups
      .call(this.dragEvents)
      .each(function(dimension) {
        let axis = d3.axisLeft(self.yScales[dimension]);
        if (self.data[0][dimension].longLabels) {
          //only display the first 12 chars in long text labels
          axis.tickFormat(dim => dim.slice(0, 12));
        }

        //add axis to the group
        d3.select(this).call(axis);

        let dimensionUnit = self.data[0][dimension].unit;
        let dimensionName =
          dimension.charAt(0).toUpperCase() + dimension.slice(1);
        //add axis label at top
        d3.select(this)
          .append("text")
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .attr("y", -65)
          .text(
            dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "")
          );
        //add Y button
        d3.select(this)
          .append("foreignObject")
          .attr("y", -30)
          .attr("x", -22)
          .attr("width", 50)
          .attr("height", 25)
          .append("xhtml:div")
          .append("button")
          .attr("type", "button")
          .classed("buttonY", true)
          .classed("selectedButton", self.selectedY.id === dimension)
          .html("Set Y")
          .on("click", function() {
            self.selectedY = {
              id: dimension,
              name: dimensionName,
              unit: dimensionUnit
            };
            self.updateScatterAxes(null, self.selectedY);
            self.svg.selectAll(".buttonY").classed("selectedButton", false);
            d3.select(this).classed("selectedButton", true);
          });
        //add X button
        d3.select(this)
          .append("foreignObject")
          .attr("y", -55)
          .attr("x", -22)
          .attr("width", 50)
          .attr("height", 25)
          .append("xhtml:div")
          .append("button")
          .attr("type", "button")
          .classed("buttonX", true)
          .classed("selectedButton", self.selectedX.id === dimension)
          .html("Set X")
          .on("click", function() {
            self.selectedX = {
              id: dimension,
              name: dimensionName,
              unit: dimensionUnit
            };
            self.updateScatterAxes(self.selectedX);
            self.svg.selectAll(".buttonX").classed("selectedButton", false);
            d3.select(this).classed("selectedButton", true);
          });
      });
  }

  update() {}

  getPath(datum) {
    let self = this;
    return d3.line()(
      this.dimensions.map(function(dimension) {
        return [
          self.getPosition(dimension),
          self.yScales[dimension](datum[dimension].value)
        ];
      })
    );
  }

  getPosition(dimension) {
    //if the axis is being dragged, use that position rather than one from the xScale
    let dragPosition = this.dragging ? this.dragging[dimension] : null;
    return !dragPosition ? this.xScale(dimension) : dragPosition;
  }

  //based on https://bl.ocks.org/jasondavies/1341281
  createDragEvents() {
    let self = this;
    this.dragging = {};
    this.dragEvents = d3
      .drag()
      .on("start", function(dimension) {
        //store the current "correct" position of grabbed axis
        self.dragging[dimension] = self.xScale(dimension);
      })
      .on("drag", function(dimension) {
        //get latest moved position of grabbed axis
        self.dragging[dimension] = Math.min(
          self.width,
          Math.max(0, d3.event.x)
        );

        //reorder axes if the grabbed axis has moved far enough to displace another One
        //Note: getPosition uses this.dragging
        let origDimensions = self.dimensions.slice();
        self.dimensions.sort(function(a, b) {
          return self.getPosition(a) - self.getPosition(b);
        });
        let orderChanged = false;
        //there is probably a smarter way to handle this but I'm lazy
        for (let i = 0; i < self.dimensions.length; i++) {
          if (self.dimensions[i] !== origDimensions[i]) {
            orderChanged = true;
            break;
          }
        }
        //update xScale now that order might have changed
        self.xScale.domain(self.dimensions);

        //update axis positions using new xScale
        if (orderChanged) {
          d3.selectAll(".dimension")
            .transition()
            .duration(700)
            .attr("transform", function(dim) {
              return (
                "translate(" +
                self.getPosition(dim) +
                "," +
                self.margin.top +
                ")"
              );
            });

          //update lines to follow the moving axis
          self.linesGroup
            .transition()
            .duration(700)
            .attr("d", self.getPath.bind(self));
        } else {
          d3.selectAll(".dimension").attr("transform", function(dim) {
            return (
              "translate(" + self.getPosition(dim) + "," + self.margin.top + ")"
            );
          });

          //update lines to follow the moving axis
          self.linesGroup.attr("d", self.getPath.bind(self));
        }
      })
      .on("end", function(dimension) {
        delete self.dragging[dimension];

        //bounce axis/lines back to the nearest "standard" position, to preserve equal spacing
        d3.select(this)
          .transition()
          .duration(300)
          .attr(
            "transform",
            "translate(" + self.xScale(dimension) + "," + self.margin.top + ")"
          );
        self.linesGroup
          .transition()
          .duration(300)
          .attr("d", self.getPath.bind(self));
      });
  }
}
