d3.csv("data/confirmed-planets.csv").then(rawData => {

    data  = rawData.map(function(d){
        return {
            id: Number(d.loc_rowid),
            mass: Number(d.pl_bmassj),
            discoveryMethod: d.pl_discmethod,
            facility: d.pl_facility,
            name: d.pl_name,
            radius: Number(d.pl_radj),
            lastUpdate: d.rowupdate,
            distance: Number(d.st_dist)
        }
    })
});
