class Tooltip {
  constructor(extraClass) {
    this.div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    if(extraClass)
      this.div.classed(extraClass,true)

  }

  show(html, left, top){
    let opacity = this.div.classed("storyTooltip") ? 1 : .9
    this.div.transition()
      .duration(200)
      .style("opacity", opacity);
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
