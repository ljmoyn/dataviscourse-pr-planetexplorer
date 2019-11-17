class ParallelAxes {
  constructor(data, updateScatterAxes, dimensionMetadata) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
    this.updateScatterAxes = updateScatterAxes;
    this.margin = {
      top: 80,
      right: 20,
      bottom: 85,
      left: 20
    };

    this.width = 2000;
    this.height = 500;
    this.svg = d3
      .select("#parallelAxes")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.dimensions = d3.keys(this.dimensionMetadata).filter(function(dimension) {
      return this.dimensionMetadata[dimension].order >= 0;
    }.bind(this));
    this.dimensions.sort(function(a, b) {
      return (this.dimensionMetadata[a].order > this.dimensionMetadata[b].order) ? 1 : -1
    }.bind(this));

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

    this.xScale = d3
      .scalePoint()
      .domain(this.dimensions)
      .rangeRound([0, this.width])
      .padding(0.25);
    this.yScales = {};

    //http://plnkr.co/edit/dCNuBsaDNBwr7CrAJUBe?p=preview
    //initialize yScales, which is an object containing scales for each dimension
    for (let i = 0; i < this.dimensions.length; i++) {
      let dimension = this.dimensions[i];
      let values = this.data.map(function(datum) {
        return datum[dimension];
      });
      //non-numerical data needs a different type of scale
      if (values.some(v => isNaN(v))) {
        let uniqueValues = values.map(v => v);
        uniqueValues = uniqueValues.filter(function(v, i) {
          return uniqueValues.indexOf(v) == i;
        });
        if (dimension === "facility" || dimension === "discoveryMethod") {
          uniqueValues.sort(function(a, b) {
            let aCount = 0;
            let bCount = 0;
            for (let i = 0; i < this.data.length; i++) {
              if (this.data[i][dimension] === a) aCount++;
              if (this.data[i][dimension] === b) bCount++;
            }

            if (aCount === bCount) return 0;

            return aCount > bCount ? 1 : -1;
          }.bind(this));
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
              return +datum[dimension];
            })
          )
          .range([this.height, 0])
          .nice();
      }

      //initialize brushes for each axis
      this.yScales[dimension].brush = d3.brushY()
        .extent([
          [-8, this.yScales[dimension].range()[1]],
          [8, this.yScales[dimension].range()[0]]
        ])
        .on('brush brush end', this.brush.bind(this))
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
    let self = this;
    //this.createDragEvents();
    this.dimensionGroups
      .enter()
      .append("g")
      .attr("class", "dimension axis")
      .attr("transform", function(d) {
        return "translate(" + this.xScale(d) + "," + this.margin.top + ")";
      }.bind(this))
      //apply drag events to the groups
      .each(function(dimension) {
        let axis = d3.axisLeft(self.yScales[dimension]);
        if (self.dimensionMetadata[dimension].longLabels) {
          //only display the first 12 chars in long text labels
          axis.tickFormat(dim => dim.slice(0, 12));
        }

        //add axis to the group
        d3.select(this).call(axis);

        //apply brush to each group
        d3.select(this).call(self.yScales[dimension].brush);

        let dimensionUnit = self.dimensionMetadata[dimension].unit;
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
      })
      //Add brush group to each axis
      .append("g")
      .classed("brush", true)
      .each(function(dimension) {
        d3.select(this).call(self.yScales[dimension].brush);
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16)

    let yPos = this.margin.top + this.height + 50;
    this.missingDataGroup = this.svg.append("g").attr("id", "missing-data")
      .attr("transform", "translate(0," + yPos + ")");
    this.missingDataGroup.append("line")
      .attr("stroke", 1)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", this.width)
      .attr("y2", 0);
    this.missingDataGroup.append("text")
      .text("Missing Data")
      .attr("transform", "translate(30,-13)")

    this.missingDataGroup.append("foreignObject")
      .attr("y", -30)
      .attr("x", 120)
      .attr("width", 200)
      .attr("height", 30)
      .append("xhtml:div")
      .append("button")
      .attr("type", "button")
      .attr("id", "incompleteDataButton")
      .html("Hide Incomplete Data")
      .on("click", function() {
        this.toggleIncompleteData();
      }.bind(this));

    this.toggleIncompleteData()
  }

  getPath(datum) {
    return d3.line()(
      this.dimensions.map(function(dimension) {

        let value = datum[dimension];
        if (value === null) {
          value = this.yScales[dimension].invert(this.height + 50)
        }
        return [
          this.getPosition(dimension),
          this.yScales[dimension](value)
        ];
      }.bind(this))
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
        this.dragging[dimension] = this.xScale(dimension);
      }.bind(this))
      .on("drag", function(dimension) {
        //get latest moved position of grabbed axis
        this.dragging[dimension] = Math.min(
          this.width,
          Math.max(0, d3.event.x)
        );

        //reorder axes if the grabbed axis has moved far enough to displace another One
        //Note: getPosition uses this.dragging
        let origDimensions = this.dimensions.slice();
        this.dimensions.sort(function(a, b) {
          return this.getPosition(a) - this.getPosition(b);
        }.bind(this));
        let orderChanged = false;
        //there is probably a smarter way to handle this but I'm lazy
        for (let i = 0; i < this.dimensions.length; i++) {
          if (this.dimensions[i] !== origDimensions[i]) {
            orderChanged = true;
            break;
          }
        }
        //update xScale now that order might have changed
        this.xScale.domain(this.dimensions);

        //update axis positions using new xScale
        if (orderChanged) {
          d3.selectAll(".dimension")
            .transition()
            .duration(700)
            .attr("transform", function(dim) {
              return (
                "translate(" +
                this.getPosition(dim) +
                "," +
                this.margin.top +
                ")"
              );
            }.bind(this));

          //update lines to follow the moving axis
          this.linesGroup
            .transition()
            .duration(700)
            .attr("d", this.getPath.bind(this));
        } else {
          d3.selectAll(".dimension").attr("transform", function(dim) {
            return (
              "translate(" + this.getPosition(dim) + "," + this.margin.top + ")"
            );
          }.bind(this));

          //update lines to follow the moving axis
          this.linesGroup.attr("d", this.getPath.bind(this));
        }
      }.bind(this))
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

  //Source: https://stackoverflow.com/questions/46591962/d3-v4-parallel-coordinate-plot-brush-selection
  brush() {
    let activeBrushes = [];
    //Get currently active brushes
    this.svg.selectAll('.brush')
      .filter(function(d) {
        return d3.brushSelection(this);
      })
      .each(function(d) {
        activeBrushes.push({
          dimension: d,
          extent: d3.brushSelection(this)
        });
      });

    if (activeBrushes.length === 0) {
      this.linesGroup.classed("active", false);
      return;
    }

    //select the lines
    let yScales = this.yScales;
    this.linesGroup.classed("active", function(datum) {

      //check if current line is within the extent of every active brush
      let withinBrushes = activeBrushes.every(function(activeBrush) {
        let dimension = activeBrush.dimension;
        return activeBrush.extent[0] <= yScales[dimension](datum[dimension]) &&
          yScales[dimension](datum[dimension]) <= activeBrush.extent[1];
      })

      if (withinBrushes)
        d3.select(this).raise()

      //set active class on path if it is within the extent
      return withinBrushes;
    });
  }

  toggleIncompleteData() {
    let button = d3.select("#incompleteDataButton");
    let selected = button.classed("selectedButton");
    d3.select("#incompleteDataButton").classed("selectedButton", !selected)
    selected = !selected;

    this.linesGroup.classed("hidden", function(datum) {
      if (!selected)
        return false;

      for (let key in datum) {
        if (datum[key] === null)
          return true;
      }
      return false;
    })
  }
}
