class Dropdown {
  constructor(target, x, y, width, height, options, initialValue, metadata, fontSize, id, label) {
    this.container = target.append("foreignObject")
          .attr("x", x)
          .attr("y", y)
          .attr("width", width)
          .attr("height", height)
          .append("xhtml:div")

    if(label && id){
      this.container.append("label")
        .attr("for",id)
        .html(label)
    }

    this.select = this.container
      .append("select")
      .attr("id",id)
      .classed("dropdown", true)
      .style("margin-left", label && id ? "10px" : null)
      .style("font-size", fontSize)

    this.select.selectAll("option")
      .data(options)
      .enter()
      .append("option")
      .text(function(dim) {
        let dimensionUnit = metadata[dim].unit;
        return metadata[dim].name + (dimensionUnit ? " (" + dimensionUnit + ")" : "");
      })
      .attr("value", function(dim) {
        return dim;
      });

    this.select.property("value", initialValue)


  }
}
