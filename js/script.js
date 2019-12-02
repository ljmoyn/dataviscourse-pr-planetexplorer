d3.csv("data/confirmed-planets.csv").then(rawData => {
  d3.json("data/discoveryMethods.json").then(discoveryMethods => {
    data = rawData.map(function(d) {
      cleanDatum = {
        mass: d.pl_masse === "" ? null : Number(d.pl_masse),
        discoveryMethod: d.pl_discmethod,
        facility: d.pl_facility,
        name: d.pl_name,
        radius: d.pl_rade === "" ? null : Number(d.pl_rade),
        year: d.pl_disc,
        distance: d.st_dist === "" ? null : Number(d.st_dist),
        density: d.pl_dens === "" ? null : Number(d.pl_dens),
        numPlanetsInSystem: d.pl_pnum === "" ? null : Number(d.pl_pnum),
        stellarName: d.pl_hostname,
        stellarMass: d.st_mass === "" ? null : Number(d.st_mass),
        stellarRadius: d.st_rad === "" ? null : Number(d.st_rad),
        stellarTemperature: d.st_teff === "" ? null : Number(d.st_teff),
        opticalMagnitude: d.st_optmag === "" ? null : Number(d.st_optmag),
        orbitalPeriod: d.pl_orbper === "" ? null : Number(d.pl_orbper),
        orbitalSemimajorAxis: d.pl_orbsmax === "" ? null : Number(d.pl_orbsmax),
        eccentricity: d.pl_orbeccen === "" ? null : Number(d.pl_orbeccen),
        inclination: d.pl_orbincl === "" ? null : Number(d.pl_orbincl),
        rightAscension: d.ra === "" ? null : Number(d.ra),
        declination: d.dec === "" ? null : Number(d.dec),
        discoveryReference: d.pl_disc_reflink,
        discoveryLocale: d.pl_locale,
        discoveryTelescope: d.pl_telescope,
        discoveryInstrument: d.pl_instrument,
        encyclopedia: d.pl_pelink,
        dataExplorer: d.pl_edelink
      };

      //typo in the actual archive data. This value has an extra 0.
      //correct value from encyclopedia http://exoplanet.eu/catalog/11_oph_b/
      if(cleanDatum.name === "Oph 11 b")
        cleanDatum.orbitalPeriod = 730000

      return cleanDatum;
    });

    dimensionMetadata = {
      mass: {
        unit: "Earth Masses",
        order: 3,
        name: "Mass"
      },
      discoveryMethod: {
        longLabels: true,
        order: 1,
        discrete: true,
        name: "Discovery Method"
      },
      facility: {
        longLabels: true,
        order: 0,
        discrete: true,
        name: "Facility"
      },
      name: {
        longLabels: true,
        order: -1,
        hidden: true
      },
      radius: {
        unit: "Earth Radius",
        order: 4,
        name: "Radius"
      },
      year: {
        order: -1,
        discrete: true,
        name: "Year"
      },
      distance: {
        unit: "Parsecs",
        order: 2,
        name: "Distance"
      },
      density: {
        order: -1,
        unit: "g/cm^3",
        name: "Density"
      },
      numPlanetsInSystem: {
        order: -1,
        discrete: true,
        name: "Number of Planets In System"
      },
      stellarName: {
        longLabels: true,
        order: -1,
        hidden: true
      },
      stellarMass: {
        order: -1,
        unit: "Solar Mass",
        name: "Stellar Mass"
      },
      stellarRadius: {
        order: -1,
        unit: "Solar Radius",
        name: "Stellar Radius"
      },
      stellarTemperature: {
        order: -1,
        unit: "Kelvin",
        name: "Stellar Temperature"
      },
      orbitalPeriod: {
        order: 5,
        unit: "days",
        name: "Orbital Period"
      },
      orbitalSemimajorAxis: {
        order: -1,
        unit: "AU",
        name: "Orbital Semimajor Axis"
      },
      eccentricity: {
        order: -1,
        name: "Eccentricity"
      },
      inclination: {
        order: -1,
        unit: "degrees",
        name: "Inclination"
      },
      rightAscension: {
        order: -1,
        unit: "degrees",
        name: "Right Ascension"
      },
      declination: {
        order: -1,
        unit: "degrees",
        name: "Declination"
      },
      discoveryReference: {
        order: -1,
        hidden: true
      },
      discoveryLocale: {
        order: -1,
        discrete: true,
        name: "Discovery Locale"
      },
      discoveryTelescope: {
        order: -1,
        hidden: true
      },
      discoveryInstrument: {
        order: -1,
        hidden: true
      },
      encyclopedia: {
        order: -1,
        hidden: true
      },
      dataExplorer: {
        order: -1,
        hidden: true
      }
    };

    let storyTooltip1 = new Tooltip("storyTooltip");
    let storyTooltip2 = new Tooltip("storyTooltip");
    let storyTooltip3 = new Tooltip("storyTooltip");
    let tooltip = new Tooltip();

    let storyPhase = 0;

    let scatterplot = new Scatterplot(data, dimensionMetadata, tooltip);
    let violin = new Violin(data, dimensionMetadata, tooltip);
    let parallelAxes = new ParallelAxes(
      data,
      dimensionMetadata,
      tooltip,
      discoveryMethods
    );

    let updateParallelBrushes = function(xDimension, yDimension, extent) {
      parallelAxes.updateBrushesFromScatterplot(xDimension, yDimension, extent);
    };

    let updateScatterplotBrush = function(dataExtents) {
      scatterplot.updateBrushFromParallel(dataExtents);
    };

    scatterplot.createScatterplot(updateParallelBrushes);
    violin.createViolin();
    parallelAxes.createParallelAxes(updateScatterplotBrush);

    d3.select("#clearBrushes").on("click", function() {
      //clearing brush in parallel will automatically send event to clear in scatterplot
      parallelAxes.clearAllBrushes();
    });

    d3.select("#filterByBrushes").on("click", function() {
      parallelAxes.filterByBrushes();
      scatterplot.filterByBrushes();
    });

    d3.select("#clearFilter").on("click", function() {
      parallelAxes.clearFilter(data);
      scatterplot.clearFilter(data);
    });

    let updateStory = function(storyPhase){

      storyTooltip1.hide();
      storyTooltip2.hide();
      storyTooltip3.hide();

      switch(storyPhase){
        case 1:
          storyTooltip1.show(`<h5>Parallel Coordinates</h5>This plot allows you to compare multiple data attributes at once.
            The data can be selected using the dropdowns at the top of each axis. The two leftmost axes allow for discrete/categorical data, while the rest are continuous<br/><br/>
            Lines can be selected by clicking and dragging along an axis, or clicking on a categorical axis label. Hovering over the labels for discovery methods will provide a detailed description of each one.<br/><br/>
            We only have partial information on most planets. There is a toggle at the bottom of the plot which can be used to hide lines for planets with incomplete data.`, 500, 200)
          storyTooltip2.show(`<h5>Violin Plots</h5>This plot takes categorical/discrete data on the x axis, and shows its distribution in terms of the chosen continuous data. The plots are ordered from left to right in terms of the total number of planets`, 500, 1000)
          storyTooltip3.show(`<h5>Units</h5>Some of the units used by astrophysicists may be unfamiliar to the user.
              <b>Astronomical Unit (AU):</b>Roughly the distance from the earth to the sun. 1.496e+11 Meters <br/>
              <b>Parsec:</b> Defined as the distance at which one astronomical unit subtends an angle of one arcsecond. 3.26 Light Years.<br/>
              <b>Earth Mass:</b> 5.972e+24 kg<br/>
              <b>Solar Mass:</b> 2e+30 kg`, 1000, 200)

          break;
        case 2:
          window.scrollTo(0,0)
          storyTooltip1.show(`<h5>The Dominant Method</h5> In terms of total number of planets, Transit is by far the most successful method. It accounts for 76% of everything in the archive. Most of the remainder were discovered by Radial Velocity. Every remaining method combined accounts for only 4.3% of planets.`, 500, 200)
          break;
        case 3:
          window.scrollTo(0,window.outerHeight)
          storyTooltip1.show(`<h5>The Strength of Microlensing</h5> When comparing the distances of planets discovered with each method, Microlensing stands out. While most of the others are limited to about 2000 parsecs of range, Microlensing has been used to find planets that are over 8000 parsecs away. For reference, that is about the same distance as the center of the galaxy.`, 500, 1000)
          break;
        case 4:
          window.scrollTo(0,0)
          storyTooltip1.show(`<h5>A Disadvantage of Microlensing</h5> As previously mentioned, Microlensing is used much less frequently than some other methods. This is largely because it requires a precise alignment between earth, a massive lensing object, and a target, which is extremely rare. <br/><br/>
            When comparing the the data, one thing to note is that we don't know the radius of ANY planets discovered by microlensing. This makes sense because it does not rely on light being blocked by the planet, unlike other methods.`, 500, 200)
          break;
        case 5:
          window.scrollTo(0,0)
          storyTooltip1.show(`<h5>Facilities</h5>NASA's Kepler space telescope has discovered about 57% of all exoplanets since it was launched in 2009. The second most prolific facility, K2 with 9.6%, is actually just the kepler telescope after it received a new mission name.<br/></br>
          This success makes sense, as kepler was specifically designed as an exoplanet hunter.`, 500, 200)
          break;
        default:
      }
      parallelAxes.story(storyPhase);
      violin.story(storyPhase);
    }

    d3.select("#next").on("click", function(){
      if(storyPhase < 5)
        storyPhase += 1;
      else
        storyPhase = 0

      d3.select("#walkHeader").html(storyPhase === 0 ? "Walkthrough" : "Walkthrough (" + storyPhase + "/5)")

      updateStory(storyPhase);
    });

    d3.select("#previous").on("click", function(){
      if(storyPhase > 0){
        storyPhase -= 1;

        d3.select("#walkHeader").html(storyPhase === 0 ? "Walkthrough" : "Walkthrough (" + storyPhase + "/5)")

        updateStory(storyPhase);
      }
    });

    //GenerateDiscoveryMethodsJSON(data);

    let facilities = data.map(d => d.facility);
    facilities = facilities.filter(
      (facility, index) => facilities.indexOf(facility) === index
    );
  });
});

function GenerateDiscoveryMethodsJSON(data) {
  let discoveryMethods = data.map(d => d.discoveryMethod);
  discoveryMethods = discoveryMethods.filter(
    (method, index) => discoveryMethods.indexOf(method) === index
  );
  discoveryMethods = discoveryMethods.map(function(d) {
    result = {
      name: d
    };
    switch (d) {
      case "Radial Velocity":
        result.description =
          'The radial velocity (RV) method (sometimes referred to as the "Doppler wobble" method) is an indirect method for detecting exoplanets which depends on measuring the small reflex motion of a star caused by an exoplanet companion as the two orbit their common center of gravity. Since the star is so much more massive than the planet, this reflex motion is very small, typically on the order of a few to hundreds of meters per second. The motion is detected using high-resolution spectroscopy to measure tiny Doppler shifts in the stellar spectrum toward the blue or red as the star changes its velocity along the line of sight, yielding information on the mass of the planet and its orbital period and eccentricity. Reviews of the method can be found in Radial Velocity by Lovis & Fischer';
        result.source =
          "https://exoplanetarchive.ipac.caltech.edu/applications/DocSet/index.html?doctree=/docs/docmenu.xml&startdoc=item_1_01";
        break;
      case "Transit":
        result.description =
          "The transit method of discovery relies on the fact that, if a planetary system is aligned in a certain way with respect to the Earth, the planets will pass between the Earth and the host star, periodically blocking some of the starlight. By monitoring the brightness of the host star, these transit events can be observed, and used to measure the properties of the planets in the system. More explanation can be found here. In addition, variations in the times that the transits are observed from strict periodicity (or times of eclipses in a stellar binary system) can be used to infer the presence of additional planets in the system tugging on the transiting planet. Finally, additional modulations in the stellar light curve due to the planet (Doppler beaming, ellipsoidal variations and reflection modulations) can also be used to confirm its presence.";
        result.source =
          "https://exoplanetarchive.ipac.caltech.edu/applications/DocSet/index.html?doctree=/docs/docmenu.xml&startdoc=item_1_01";
        break;
      case "Microlensing":
        result.description =
          'Gravitational microlensing refers to the transient magnification of the apparent brightness of a distant star that is caused by the gravitational potential of an intervening "lensing" system. If this lens system contains one or more planets, it is often possible to measure their properties from the structure of the resulting light curve. For more details, see this review on planet detection with microlensing or this community-maintained web resource with introductory microlensing explanations and interactive demonstrations of the effect.';
        result.source =
          "https://exoplanetarchive.ipac.caltech.edu/applications/DocSet/index.html?doctree=/docs/docmenu.xml&startdoc=item_1_01";
        break;
      case "Imaging":
        result.description =
          "The brightness contrast between a star and an orbiting exoplanet is typically so high that any light from the exoplanet is completely swamped by the starlight. However some exoplanets (typically very young, very large, and very far from their host star) are bright enough, either in reflected light from their host star or in thermal emission, that they can be observed directly, usually after careful removal of the starlight. Go here for further details.";
        result.source =
          "https://exoplanetarchive.ipac.caltech.edu/applications/DocSet/index.html?doctree=/docs/docmenu.xml&startdoc=item_1_01";
        break;
      case "Eclipse Timing Variations":
        result.description =
          'When a binary star system is aligned such that – from the Earth\'s point of view – the stars pass in front of each other in their orbits, the system is called an "eclipsing binary" star system. The time of minimum light, when the star with the brighter surface is at least partially obscured by the disc of the other star, is called the primary eclipse, and approximately half an orbit later, the secondary eclipse occurs when the brighter surface area star obscures some portion of the other star. These times of minimum light, or central eclipses, constitute a time stamp on the system, much like the pulses from a pulsar (except that rather than a flash, they are a dip in brightness). If there is a planet in circumbinary orbit around the binary stars, the stars will be offset around a binary-planet center of mass. As the stars in the binary are displaced back and forth by the planet, the times of the eclipse minima will vary. The periodicity of this offset may be the most reliable way to detect extrasolar planets around close binary systems. With this method, planets are more easily detectable if they are more massive, orbit relatively closely around the system, and if the stars have low masses.';
        result.source =
          "https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets#Eclipsing_binary_minima_timing";
        break;
      case "Astrometry":
        result.description =
          "This method consists of precisely measuring a star's position in the sky, and observing how that position changes over time. If a star has a planet, then the gravitational influence of the planet will cause the star itself to move in a tiny circular or elliptical orbit. Effectively, star and planet each orbit around their mutual centre of mass. Since the star is much more massive, its orbit will be much smaller. Consequently, it is easier to find planets around low-mass stars, especially brown dwarfs.";
        result.source =
          "https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets#Astrometry";
        result.notes = [
          "not direct copy from source.",
          "The space-based observatory Gaia, launched in 2013, is expected to find thousands of planets via astrometry, but prior to the launch of Gaia, no planet detected by astrometry had been confirmed.",
          "One potential advantage of the astrometric method is that it is most sensitive to planets with large orbits. This makes it complementary to other methods that are most sensitive to planets with small orbits.",
          "changes in stellar position are so small—and atmospheric and systematic distortions so large—that even the best ground-based telescopes cannot produce precise enough measurements."
        ];
        break;
      case "Disk Kinematics":
        result.description =
          "Many young stars are surrounded by disks of gas and dust. These disks are typically dominated by keplerian rotation, and embedded planets can disturb the gas flow in identifieable patterns. This was only recently used to discover new exoplanets, first described in a paper published in August 2019.";
        result.source =
          "https://ui.adsabs.harvard.edu/abs/2019NatAs.tmp..419P/abstract";
        break;
      case "Pulsar Timing":
        result.description =
          "A pulsar is a neutron star: the small, ultradense remnant of a star that has exploded as a supernova. Pulsars emit radio waves extremely regularly as they rotate. Because the intrinsic rotation of a pulsar is so regular, slight anomalies in the timing of its observed radio pulses can be used to track the pulsar's motion. Like an ordinary star, a pulsar will move in its own small orbit if it has a planet. Calculations based on pulse-timing observations can then reveal the parameters of that orbit. \n This method was not originally designed for the detection of planets, but is so sensitive that it is capable of detecting planets far smaller than any other method can, down to less than a tenth the mass of Earth. It is also capable of detecting mutual gravitational perturbations between the various members of a planetary system, thereby revealing further information about those planets and their orbital parameters. In addition, it can easily detect planets which are relatively far away from the pulsar. \n There are two main drawbacks to the pulsar timing method: pulsars are relatively rare, and special circumstances are required for a planet to form around a pulsar. Therefore, it is unlikely that a large number of planets will be found this way. Additionally, life would likely not survive on planets orbiting pulsars due to the high intensity of ambient radiation.";
        result.source =
          "https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets#Pulsar_timing";
        break;
      case "Transit Timing Variations":
        result.description =
          "The transit timing variation method considers whether transits occur with strict periodicity, or if there is a variation. When multiple transiting planets are detected, they can often be confirmed with the transit timing variation method. This is useful in planetary systems far from the Sun, where radial velocity methods cannot detect them due to the low signal-to-noise ratio. If a planet has been detected by the transit method, then variations in the timing of the transit provide an extremely sensitive method of detecting additional non-transiting planets in the system with masses comparable to Earth's. It is easier to detect transit-timing variations if planets have relatively close orbits, and when at least one of the planets is more massive, causing the orbital period of a less massive planet to be more perturbed.";
        result.source =
          "https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets#Transit_timing";
        break;
      case "Pulsation Timing Variations":
        result.description =
          "Like pulsars, some other types of pulsating variable stars are regular enough that radial velocity could be determined purely photometrically from the Doppler shift of the pulsation frequency, without needing spectroscopy. This method is not as sensitive as the pulsar timing variation method, due to the periodic activity being longer and less regular. The ease of detecting planets around a variable star depends on the pulsation period of the star, the regularity of pulsations, the mass of the planet, and its distance from the host star.";
        result.source =
          "https://en.wikipedia.org/wiki/Methods_of_detecting_exoplanets#Variable_star_timing";
        break;
      case "Orbital Brightness Modulation":
        result.description =
          "A heavy planet orbiting close to a star can distort the shape of the star in a regular way. When the shape change modifies the area of the star as seen from Earth, the brightness of the star undergoes a regular change, indicating the presence of a planet.";
        result.source = "http://www.seti-setr.org/SETL/PlanetMethods.html";
        break;
      default:
        result.description = "";
        result.source = "";
        break;
    }
    return result;
  });

  //just break after this line and copy string from browser debugger;
  stringJSON = JSON.stringify(discoveryMethods);
}
