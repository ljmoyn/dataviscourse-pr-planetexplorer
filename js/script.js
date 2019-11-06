d3.csv("data/confirmed-planets.csv").then(rawData => {
  d3.json('data/discoveryMethods.json').then(discoveryMethods => {

    data = rawData.map(function(d) {
      return {
        id: {
          value: Number(d.loc_rowid)
        },
        mass: {
          value: Number(d.pl_bmassj),
          unit: "Jupiter Masses"
        },
        discoveryMethod: {
          value: d.pl_discmethod
        },
        facility: {
          value: d.pl_facility
        },
        name: {
          value: d.pl_name
        },
        radius: {
          value: Number(d.pl_radj),
          unit: "Jupiter Radius"
        },
        lastUpdate: {
          value: d.rowupdate
        },
        distance: {
          value: Number(d.st_dist),
          unit: "Parsecs"
        }
      };
    });

    let scatterplot = new Scatterplot(data);
    scatterplot.createScatterplot();

    let updateScatterAxes = function(selectedX, selectedY) {
      if (selectedX)
        scatterplot.selectedX = selectedX;
      if (selectedY)
        scatterplot.selectedY = selectedY

      scatterplot.updateScatterplot();
    }
    let parallelAxes = new ParallelAxes(data, updateScatterAxes);

    //GenerateDiscoveryMethodsJSON(data);

    let facilities = data.map(d => d.facility);
    facilities = facilities.filter(
      (facility, index) => facilities.indexOf(facility) === index
    );
  })
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
          "When a binary star system is aligned such that – from the Earth\'s point of view – the stars pass in front of each other in their orbits, the system is called an \"eclipsing binary\" star system. The time of minimum light, when the star with the brighter surface is at least partially obscured by the disc of the other star, is called the primary eclipse, and approximately half an orbit later, the secondary eclipse occurs when the brighter surface area star obscures some portion of the other star. These times of minimum light, or central eclipses, constitute a time stamp on the system, much like the pulses from a pulsar (except that rather than a flash, they are a dip in brightness). If there is a planet in circumbinary orbit around the binary stars, the stars will be offset around a binary-planet center of mass. As the stars in the binary are displaced back and forth by the planet, the times of the eclipse minima will vary. The periodicity of this offset may be the most reliable way to detect extrasolar planets around close binary systems. With this method, planets are more easily detectable if they are more massive, orbit relatively closely around the system, and if the stars have low masses.";
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
  stringJSON = JSON.stringify(discoveryMethods)
}
