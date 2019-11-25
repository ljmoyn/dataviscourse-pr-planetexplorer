class Dropdown {
  constructor(target, dimensions, initialValue, metadata) {
    this.select = target
      .append("foreignObject")
      .attr("y", -50)
      .attr("x", -125)
      .attr("width", 250)
      .attr("height", 40)
      .append("xhtml:div")
      .append("select")
      .classed("dropdown", true)

    this.select.selectAll("option")
      .data(dimensions)
      .enter()
      .append("option")
      .text(function(dim) {
        let dimensionUnit = metadata[dim].unit;
        let dimensionName = dim.charAt(0).toUpperCase() + dim.slice(1);
        return dimensionName + (dimensionUnit ? " (" + dimensionUnit + ")" : "");
      })
      .attr("value", function(dim) {
        return dim;
      });

    this.select.property("value", initialValue)

  }
}
