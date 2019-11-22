class ParallelAxes {
  constructor(data, updateScatterAxes, dimensionMetadata) {
    this.data = data;
    this.dimensionMetadata = dimensionMetadata;
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
          [-8, this.yScales[dimension].range()[1]-5],
          [8, this.yScales[dimension].range()[0]+5]
        ])
        .on("brush brush end", this.brush.bind(this));
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
      .attr(
        "transform",
        function(d) {
          return "translate(" + this.xScale(d) + "," + this.margin.top + ")";
        }.bind(this)
      )
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

          if(self.dimensionMetadata[dimension].order > 1){
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
              .data(self.dimensions.filter(function(dim){
                return self.dimensionMetadata[dim].order > 1
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
                .on("change", function(newDim){

                })
            }
            else {
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
      .append("g")
      .classed("brush", true)
      .each(function(dimension) {
        d3.select(this).call(self.yScales[dimension].brush);
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

      this.createMissingDataGroup();
  }

  getPath(datum) {
    return d3.line()(
      this.dimensions.map(
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
      this.linesGroup.classed("active", false);
      return;
    }

    //select the lines
    let yScales = this.yScales;
    this.linesGroup.classed("active", function(datum) {
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

  createMissingDataGroup(){
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

    let toggleLines = function(type){
      if(type === "end" && !initiallyHidden)
        return;

      if(type === "start" && initiallyHidden)
        return;

      this.linesGroup.classed("hidden", function(datum) {
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
      .on("start", function(){
        toggleLines("start")
      }.bind(this))
      .on("end", function(){
        toggleLines("end")
      }.bind(this))
    //update lines to follow the moving axis
    //this.linesGroup.transition().duration(500).attr("d", this.getPath.bind(this));
  }
}
