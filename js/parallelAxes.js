class ParallelAxes {
  constructor(data, updateScatterAxes, dimensionMetadata, tooltip, discoveryMethods) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
    this.tooltip = tooltip;
    this.discoveryMethods = discoveryMethods;

    this.updateScatterAxes = updateScatterAxes;
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
      .attr("transform", "translate(0," + this.margin.top + ")")

    this.linesGroup.selectAll("path")
      .data(this.data)
      .enter()
      .append("path")
      .attr("d", this.getPath.bind(this));

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
          let dropdown = d3.select(this)
            .append("foreignObject")
            .attr("y", -50)
            .attr("x", -125)
            .attr("width", 250)
            .attr("height", 40)
            .append("xhtml:div")
            .append("select")
            .classed("axisDropdown", true)
          dropdown.selectAll("option")
            .data(self.dimensions.filter(function(dim) {
              return self.dimensionMetadata[dim].order != 0 && self.dimensionMetadata[dim].order != 1 && self.dimensionMetadata[dim].hidden !== true
            }))
            .enter()
            .append("option")
            .text(function(dim) {
              let dimensionUnit = self.dimensionMetadata[dim].unit;
              let dimensionName = dim.charAt(0).toUpperCase() + dim.slice(1);
              return dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "");
            })
            .attr("value", function(dim) {
              return dim;
            });

          dropdown.property("value", dimension)
            .on("change", function(previousDim, num, target) {
              let newDim = target[0].value;
              let position = this.dimensionMetadata[previousDim].order;

              //if switched to a column that is already displayed, want to swap positions
              this.dimensionMetadata[previousDim].order = this.dimensionMetadata[newDim].order;
              this.dimensionMetadata[newDim].order = position;

              this.update();

            }.bind(self))

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

      })

    //Add brush group to each axis
    this.dimensionGroups.append("g")
      .classed("brush", true)
      .each(function(dimension) {
        d3.select(this).call(self.yScales[dimension].brush);
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

    this.createMissingDataGroup();
  }

  setAxis(target, dimension){
    let axis = d3.axisLeft(this.yScales[dimension]);
    if (this.dimensionMetadata[dimension].longLabels) {
      //only display the first 12 chars in long text labels
      axis.tickFormat(dim => dim.slice(0, 12));
    }
    if(dimension === "year"){
      axis.tickFormat(d3.format("d"));
    }
    //add axis to the group
    let axisDom = target.call(axis);

    //show tooltips when hovering over certain labels
    if(dimension === "discoveryMethod" || dimension === "facility"){
      let self = {
        discoveryMethods: this.discoveryMethods,
        tooltip: this.tooltip
      };
      axisDom.selectAll(".tick").each(function(tickLabel) {
        //on mouse hover show the tooltip
        d3.select(this).on("mouseover", function(d) {
            let html = "<h5>" + tickLabel + "</h5>";
            if(dimension === "discoveryMethod")
            {

              let method = this.discoveryMethods.find(m => m.name === tickLabel);
              html += "<p>" + method.description + "</p>"
            }

            this.tooltip.show(html);
          }.bind(self))
          .on("mouseout", function(d) {
            this.tooltip.hide();
          }.bind(self));
      })
    }
  }

  update() {
    this.updateDimensions();
    this.updateScales();

    this.linesGroup
      .selectAll("path")
      .transition()
      .duration(1000)
      .attr("d", this.getPath.bind(this))

    this.dimensionGroups = this.svg
      .selectAll(".dimension")
      .data(this.activeDimensions);
    let self = this;
    //this.createDragEvents();
    this.dimensionGroups
      //apply drag events to the groups
      .each(function(dimension) {
        let target = d3.select(this);
        self.setAxis(target, dimension)
        target.select("select").property("value", dimension)
      });

    //remove brushes
    //would be better code to clear colors using the brush function
    //but can't get that to work and this is simple
    this.linesGroup.selectAll("path").classed("active", false);
    this.dimensionGroups.selectAll(".brush").remove();

    //add new brushes corresponding to new axes
    this.dimensionGroups.append("g")
      .classed("brush", true)
      .each(function(dimension) {
        d3.select(this).call(self.yScales[dimension].brush);
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16)
  }

  updateDimensions() {
    this.activeDimensions = d3.keys(this.dimensionMetadata).filter(
      function(dimension) {
        return this.dimensionMetadata[dimension].order >= 0;
      }.bind(this)
    );

    this.activeDimensions.sort(
      function(a, b) {
        return this.dimensionMetadata[a].order > this.dimensionMetadata[b].order ?
          1 :
          -1;
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
      this.yScales[dimension].brush = d3
        .brushY()
        .extent([
          [-8, this.yScales[dimension].range()[1] - 5],
          [8, this.yScales[dimension].range()[0] + 5]
        ])
        .on("brush end", this.brush.bind(this));
    }
  }

  getPath(datum) {
    return d3.line()(
      this.activeDimensions.map(
        function(dimension) {
          let value = datum[dimension];
          if (value === null) {
            value = this.yScales[dimension].invert(this.height + 50);
          }
          return [this.xScale(dimension), this.yScales[dimension](value)];
        }.bind(this)
      )
    );
  }

  //Source: https://stackoverflow.com/questions/46591962/d3-v4-parallel-coordinate-plot-brush-selection
  brush() {
    let activeBrushes = [];
    //Get currently active brushes
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

    if (activeBrushes.length === 0) {
      this.linesGroup.selectAll("path").classed("active", false);
      return;
    }

    //select the lines
    let yScales = this.yScales;
    this.linesGroup.selectAll("path").classed("active", function(datum) {
      //check if current line is within the extent of every active brush
      let withinBrushes = activeBrushes.every(function(activeBrush) {
        let dimension = activeBrush.dimension;
        return (
          activeBrush.extent[0] <= yScales[dimension](datum[dimension]) &&
          yScales[dimension](datum[dimension]) <= activeBrush.extent[1]
        );
      });

      if (withinBrushes) d3.select(this).raise();

      //set active class on path if it is within the extent
      return withinBrushes;
    });
  }

  createMissingDataGroup() {
    let yPos = this.margin.top + this.height + 50;
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
      .append("text")
      .text("Missing Data")
      .attr("transform", "translate(30,-13)");

    this.missingDataGroup
      .append("foreignObject")
      .attr("y", -30)
      .attr("x", 120)
      .attr("width", 200)
      .attr("height", 30)
      .append("xhtml:div")
      .append("button")
      .attr("type", "button")
      .attr("id", "incompleteDataButton")
      .html("Hide Incomplete Data")
      .on(
        "click",
        function() {
          this.toggleIncompleteData();
        }.bind(this)
      );

    this.toggleIncompleteData();
  }

  toggleIncompleteData() {
    let button = d3.select("#incompleteDataButton");
    let initiallyHidden = button.classed("selectedButton");

    d3.select("#incompleteDataButton").classed("selectedButton", !initiallyHidden);

    let linePosition = initiallyHidden ? 0 : -35;

    let toggleLines = function(type) {
      if (type === "end" && !initiallyHidden)
        return;

      if (type === "start" && initiallyHidden)
        return;

      this.linesGroup.selectAll("path").classed("hidden", function(datum) {
        if (initiallyHidden) return false;

        for (let key in datum) {
          if (datum[key] === null) return true;
        }
        return false;
      });
    }.bind(this)

    this.missingDataGroup
      .select("line")
      .transition()
      .duration(500)
      .attr("transform", "translate(0," + linePosition + ")")
      .on("start", function() {
        toggleLines("start")
      }.bind(this))
      .on("end", function() {
        toggleLines("end")
      }.bind(this))
    //update lines to follow the moving axis
    //this.linesGroup.transition().duration(500).attr("d", this.getPath.bind(this));
  }
}
