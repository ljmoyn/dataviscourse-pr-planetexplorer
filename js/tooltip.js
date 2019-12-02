class Tooltip {
  constructor(data, updateScatterAxes, dimensionMetadata) {
    this.div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }

  show(html, left, top){
    this.div.transition()
      .duration(200)
      .style("opacity", 0.9);
    this.div.html(html)
      .style("left", (left ? left : (d3.event.pageX + 28)) + "px")
      .style("top", (top ? top : (d3.event.pageY - 28)) + "px");
  }

  hide(){
    this.div.transition()
      .duration(500)
      .style("opacity", 0);
  }

  setFont(font){
    this.div.style("font",font)
  }
}
