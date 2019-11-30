class ParallelAxes {
  constructor(data, dimensionMetadata, tooltip, discoveryMethods) {
    this.data = data;
    this.completeData = data;
    this.dimensionMetadata = dimensionMetadata;
    this.tooltip = tooltip;
    this.discoveryMethods = discoveryMethods;
  }

  createParallelAxes(updateScatterplotBrush) {
    this.updateScatterplotBrush = updateScatterplotBrush;
    this.margin = {
      top: 60,
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

    this.dimensions = d3.keys(this.dimensionMetadata);
    this.updateDimensions();
    this.updateScales();

    this.linesGroup = this.svg
      .append("g")
      .attr("class", "linesGroup")
      .attr("transform", "translate(0," + this.margin.top + ")");

    this.dimensionGroups = this.svg
      .selectAll(".dimension")
      .data(this.activeDimensions);
    let self = this;
    //this.createDragEvents();
    this.dimensionGroups = this.dimensionGroups
      .enter()
      .append("g")
      .attr("class", "dimension axis")
      .attr(
        "transform",
        function(d) {
          return "translate(" + this.xScale(d) + "," + this.margin.top + ")";
        }.bind(this)
      )
      //apply drag events to the groups
      .each(function(dimension) {
        let target = d3.select(this);
        self.setAxis.call(self, target, dimension);

        if (self.dimensionMetadata[dimension].order > 1) {
          let options = self.dimensions.filter(function(dim) {
            return (
              self.dimensionMetadata[dim].order != 0 &&
              self.dimensionMetadata[dim].order != 1 &&
              self.dimensionMetadata[dim].hidden !== true
            );
          });
          let dropdown = new Dropdown(
            target,
            -125,
            -50,
            250,
            60,
            options,
            dimension,
            self.dimensionMetadata
          );

          dropdown.select.on(
            "change",
            function(previousDim, num, target) {
              let newDim = target[0].value;
              let position = this.dimensionMetadata[previousDim].order;

              //if switched to a column that is already displayed, want to swap positions
              this.dimensionMetadata[
                previousDim
              ].order = this.dimensionMetadata[newDim].order;
              this.dimensionMetadata[newDim].order = position;

              this.update();
            }.bind(self)
          );
        } else {
          let dimensionUnit = self.dimensionMetadata[dimension].unit;
          let dimensionName =
            dimension.charAt(0).toUpperCase() + dimension.slice(1);
          //add axis label at top
          d3.select(this)
            .append("text")
            .classed("axisLabel", true)
            .attr("fill", "black")
            .style("text-anchor", "middle")

            .attr("y", -25)
            .text(
              dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "")
            );
        }
      });

    this.createMissingDataGroup();
    this.update(true);
  }

  setAxis(target, dimension) {
    let axis = d3.axisLeft(this.yScales[dimension]);
    if (this.dimensionMetadata[dimension].longLabels) {
      //only display the first 12 chars in long text labels
      axis.tickFormat(dim => dim.slice(0, 12));
    }
    if (dimension === "year") {
      axis.tickFormat(d3.format("d"));
    }
    //add axis to the group
    let axisDom = target.call(axis);

    //show tooltips when hovering over certain labels
    if (dimension === "discoveryMethod" || dimension === "facility") {
      let self = {
        discoveryMethods: this.discoveryMethods,
        tooltip: this.tooltip,
        yScales: this.yScales
      };
      axisDom.selectAll(".tick").each(function(tickLabel) {
        //on mouse hover show the tooltip
        d3.select(this)
          .on(
            "mouseover",
            function() {
              let html = "<h5>" + tickLabel + "</h5>";
              if (dimension === "discoveryMethod") {
                let method = this.discoveryMethods.find(
                  m => m.name === tickLabel
                );
                html += "<p>" + method.description + "</p>";
              }

              this.tooltip.show(html);
            }.bind(self)
          )
          .on(
            "mouseout",
            function() {
              this.tooltip.hide();
            }.bind(self)
          )
          //when user clicks a label of a categorical axis, creates a brush around that label
          .on("click", function(tickLabel, num, target) {
            let brushGroup = d3.select(this.parentNode).select(".brush");
            let dimension = brushGroup.datum();
            let tickLocation = self.yScales[dimension](tickLabel);
            let extent = [tickLocation - 5, tickLocation + 5];
            brushGroup.call(self.yScales[dimension].brush.move, extent);
          });
      });
    }
  }

  update(forInit) {
    this.updateDimensions();
    this.updateScales();

    let lines = this.linesGroup
      .selectAll("path")
      .data(this.data)

    lines.transition()
      .duration(1000)
      .attr("d", this.getPath.bind(this));

    lines.enter()
      .append("path")
      .attr("d", this.getPath.bind(this))
      .merge(lines)
    lines.exit().remove()

    this.dimensionGroups = this.svg
      .selectAll(".dimension")
      .data(this.activeDimensions);
    let self = this;
    //this.createDragEvents();
    this.dimensionGroups
      //apply drag events to the groups
      .each(function(dimension) {
        let target = d3.select(this);
        self.setAxis(target, dimension);
        target.select("select").property("value", dimension);
      });

    //remove brushes
    //would be better code to clear colors using the brush function
    //but can't get that to work and this is simple
    if(!forInit){
      this.linesGroup.selectAll("path").classed("active", false);
      this.dimensionGroups.selectAll(".brush").remove();
      this.updateScatterplotBrush(null);
    }
    //add new brushes corresponding to new axes
    this.dimensionGroups
      .append("g")
      .classed("brush", true)
      .each(function(dimension) {
        d3.select(this).call(self.yScales[dimension].brush);
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

    this.toggleIncompleteData(false);
  }

  updateDimensions() {
    this.activeDimensions = d3.keys(this.dimensionMetadata).filter(
      function(dimension) {
        return this.dimensionMetadata[dimension].order >= 0;
      }.bind(this)
    );

    this.activeDimensions.sort(
      function(a, b) {
        return this.dimensionMetadata[a].order > this.dimensionMetadata[b].order
          ? 1
          : -1;
      }.bind(this)
    );
  }

  updateScales() {
    this.xScale = d3
      .scalePoint()
      .domain(this.activeDimensions)
      .rangeRound([0, this.width])
      .padding(0.25);
    this.yScales = {};

    //http://plnkr.co/edit/dCNuBsaDNBwr7CrAJUBe?p=preview
    //initialize yScales, which is an object containing scales for each dimension
    for (let i = 0; i < this.activeDimensions.length; i++) {
      let dimension = this.activeDimensions[i];
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
          uniqueValues.sort(
            function(a, b) {
              let aCount = 0;
              let bCount = 0;
              for (let i = 0; i < this.data.length; i++) {
                if (this.data[i][dimension] === a) aCount++;
                if (this.data[i][dimension] === b) bCount++;
              }

              if (aCount === bCount) return 0;

              return aCount > bCount ? 1 : -1;
            }.bind(this)
          );
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
      this.brushWidth = 8;
      this.yScales[dimension].brush = d3
        .brushY()
        .extent([
          [-this.brushWidth, this.yScales[dimension].range()[1] - 5],
          [this.brushWidth, this.yScales[dimension].range()[0] + 5]
        ])
        .on(
          "brush end",
          function() {
            this.brush(true);
          }.bind(this)
        );
    }
  }

  getPath(datum) {
    return d3.line()(
      this.activeDimensions.map(
        function(dimension) {
          let value = datum[dimension];
          if (value === null) {
            value = this.yScales[dimension].invert(this.height + 54);
          }
          return [this.xScale(dimension), this.yScales[dimension](value)];
        }.bind(this)
      )
    );
  }

  //Source: https://stackoverflow.com/questions/46591962/d3-v4-parallel-coordinate-plot-brush-selection
  brush(userTriggered) {
    //get currently active brushes
    let activeBrushes = this.getActiveBrushes();

    //need to know if the brush event was triggered by user action or programmatically
    //Can get into infinite recursive calls of events without this check.
    let userEvent =
      d3.event.sourceEvent.screenX &&
      d3.event.sourceEvent.screenX !== 0 &&
      d3.event.sourceEvent.screenY &&
      d3.event.sourceEvent.screenY !== 0;
    if (activeBrushes.length === 0) {
      this.linesGroup.selectAll("path").classed("active", false);
      if (userEvent) this.updateScatterplotBrush(null);
      return;
    }

    //select the lines
    let yScales = this.yScales;
    this.linesGroup.selectAll("path").classed("active", function(datum) {
      //check if current line is within the extent of every active brush
      let withinBrushes = activeBrushes.every(function(activeBrush) {
        let dimension = activeBrush.dimension;
        if (datum[dimension] === null) return false;

        return (
          activeBrush.extent[0] <= yScales[dimension](datum[dimension]) &&
          yScales[dimension](datum[dimension]) <= activeBrush.extent[1]
        );
      });

      if (withinBrushes) d3.select(this).raise();

      //set active class on path if it is within the extent
      return withinBrushes;
    });

    let dataExtents = this.getDataExtents(activeBrushes);

    if (userEvent) this.updateScatterplotBrush(dataExtents);
  }

  createMissingDataGroup() {
    let yPos = this.margin.top + this.height + 55;
    this.missingDataGroup = this.svg
      .append("g")
      .attr("id", "missing-data")
      .attr("transform", "translate(0," + yPos + ")");
    this.missingDataGroup
      .append("line")
      .attr("stroke", 1)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", this.width)
      .attr("y2", 0);

    this.missingDataGroup
      .append("foreignObject")
      .attr("y", -38)
      .attr("x", 20)
      .attr("width", 250)
      .attr("height", 40)
      .append("xhtml:div")
      .append("input")
      .attr("type", "checkbox")
      .attr("data-toggle", "toggle")
      .attr("data-style", "ios")
      .attr("data-on", "Hide Incomplete Data")
      .attr("data-off", "Show Incomplete Data")
      .attr("data-width", "200")

      .attr("id", "incompleteDataToggle");

    //bootstrap controls need jquery to initialize and wire events
    $("#incompleteDataToggle").bootstrapToggle();
    $("#incompleteDataToggle").on(
      "change",
      function() {
        this.toggleIncompleteData(true);
      }.bind(this)
    );
    this.toggleIncompleteData();
  }

  toggleIncompleteData(withTransition) {
    let button = d3.select("#incompleteDataToggle");
    let showData = button.property("checked");

    let linePosition = showData ? 0 : -42;

    let toggleLines = function(type) {
      if (type === "end" && !showData) return;

      if (type === "start" && showData) return;

      this.linesGroup.selectAll("path").classed("hidden", function(datum) {
        if (showData) return false;

        for (let key in datum) {
          if (datum[key] === null) return true;
        }
        return false;
      });
    }.bind(this);

    this.missingDataGroup
      .select("line")
      .transition()
      .duration(withTransition ? 500 : 0)
      .attr("transform", "translate(0," + linePosition + ")")
      //hide the lines before/after the transition, as necessary
      .on(
        "start",
        function() {
          toggleLines("start");
        }.bind(this)
      )
      .on(
        "end",
        function() {
          toggleLines("end");
        }.bind(this)
      );
    //update lines to follow the moving axis
    //this.linesGroup.transition().duration(500).attr("d", this.getPath.bind(this));
  }

  updateBrushesFromScatterplot(xDimension, yDimension, dataExtent) {
    let self = this;
    this.svg.selectAll(".brush").each(function(dimension) {
      if (dimension === xDimension) {
        let extent =
          dataExtent !== null
            ? [
                self.yScales[dimension](dataExtent[1][0]),
                self.yScales[dimension](dataExtent[0][0])
              ]
            : null;
        d3.select(this).call(self.yScales[dimension].brush.move, extent);
      } else if (dimension === yDimension) {
        let extent =
          dataExtent !== null
            ? [
                self.yScales[dimension](dataExtent[0][1]),
                self.yScales[dimension](dataExtent[1][1])
              ]
            : null;
        d3.select(this).call(self.yScales[dimension].brush.move, extent);
      }
    });
  }

  getActiveBrushes(){
    let activeBrushes = [];
    this.svg
      .selectAll(".brush")
      .filter(function(d) {
        return d3.brushSelection(this);
      })
      .each(function(d) {
        activeBrushes.push({
          dimension: d,
          extent: d3.brushSelection(this)
        });
      });

    return activeBrushes
  }

  //get extents of the active brushes, in terms of the actual data rather than pixels
  getDataExtents(activeBrushes, includeDiscrete){
    let dataExtents = {};
    for (let i = 0; i < this.activeDimensions.length; i++) {
      let dimension = this.activeDimensions[i];

      //invert not supported for categorical scales, so skip them
      if (this.dimensionMetadata[dimension].discrete && !includeDiscrete) continue;

      let activeBrush = activeBrushes.find(
        brush => brush.dimension === dimension
      );

      if(!activeBrush)
      {
        continue;
      }

      if(this.dimensionMetadata[dimension].discrete)
      {
        for(let j = 0; j < this.data.length; j++){
          let pixelPosition = this.yScales[dimension](this.data[j][dimension]);
          if(pixelPosition >= d3.min(activeBrush.extent) && pixelPosition <= d3.max(activeBrush.extent)){
            if(!dataExtents[dimension]){
              dataExtents[dimension] = [];
            }

            if(!dataExtents[dimension].includes(this.data[j][dimension])){
              dataExtents[dimension].push(this.data[j][dimension]);
            }
          }
        }
      }
      else
      {
        dataExtents[dimension] = [
          this.yScales[dimension].invert(activeBrush.extent[0]),
          this.yScales[dimension].invert(activeBrush.extent[1])
        ];
      }
    }

    return dataExtents;
  }

  clearAllBrushes(){
    let self = this;
    this.svg.selectAll(".brush").each(function(dimension) {
        d3.select(this).call(self.yScales[dimension].brush.move, null);
    });
  }

  filterByBrushes(){
    let activeBrushes = this.getActiveBrushes();
    let dataExtents = this.getDataExtents(activeBrushes, true);
    this.data = this.data.filter(function(datum) {
      let withinExtents = true;
      for(let dimension in dataExtents){
        if(this.dimensionMetadata[dimension].discrete && !dataExtents[dimension].includes(datum[dimension]))
          return false
        else if(!this.dimensionMetadata[dimension].discrete && (datum[dimension] > dataExtents[dimension][0] || datum[dimension] < dataExtents[dimension][1]))
          return false;
      }

      return true;
    }.bind(this))

    this.update();
  }

  clearFilter(){
    this.data = this.completeData;
    this.update();
  }
}
