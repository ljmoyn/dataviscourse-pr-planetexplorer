class ParallelAxes {

      constructor(data) {
        this.data = data;

        this.margin = {
            top: 35,
            right: 20,
            bottom: 35,
            left: 20
        };

        this.width = 800;
        this.height = 400;
        this.svg = d3.select("#parallelAxes")
                      .attr("width", this.width)
                      .attr("height", this.height)

      }
}
