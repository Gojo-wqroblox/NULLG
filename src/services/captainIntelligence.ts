/**
 * Autonomous Spacecraft Fire Safety Super Intelligence: CAPTAIN
 * Comprehensive aerospace combustion & microgravity physics knowledge engine.
 */

export function generateCaptainResponse(
  question: string,
  chamberState: any,
  isBeginnerMode: boolean = true
): string {
  const q = (question || '').toLowerCase().trim();
  const o2 = chamberState?.gases?.O2 ?? 21;
  const h2 = chamberState?.gases?.H2 ?? 0;
  const ch4 = chamberState?.gases?.CH4 ?? 0;
  const sih4 = chamberState?.gases?.SiH4 ?? 0;
  const nh3 = chamberState?.gases?.NH3 ?? 0;
  const g = chamberState?.gravityG ?? 0;
  const p = chamberState?.pressureKpa ?? 101.3;
  const vent = chamberState?.ventilationSpeed ?? 0.15;
  const fuel = chamberState?.fuelType || 'Kapton Wiring';

  // 1. Hydrogen leak in Artemis 34% O2 cabin
  if (
    (q.includes('hydrogen') || q.includes('h2')) &&
    (q.includes('artemis') || q.includes('34%') || q.includes('leak') || q.includes('cabin'))
  ) {
    if (isBeginnerMode) {
      return `Captain's Emergency Briefing: A Hydrogen leak in the Artemis 34% oxygen cabin is the ultimate nightmare scenario!

• The Ghost Danger: Hydrogen burns with an almost invisible, pale ultra-violet flame. Astronauts wouldn't see smoke or bright orange fire until their equipment literally starts melting!
• The Oxygen Supercharger: Standard air is only 21% oxygen. At 34% oxygen, ordinary things catch fire instantly, and Hydrogen needs less energy than a tiny static shock from your wool sock to explode.
• Zero-G Shockwave: Without gravity, the fire expands outward as a blistering hot sphere, creating an explosive pressure wave.
• Captain's Protocol: 1. Hit the emergency fan kill switch immediately. 2. Seal the compartment hatch. 3. Flood with FK-5-1-12 clean agent gas!`;
    } else {
      return `Captain's Technical Evaluation: H₂ leakage into the NASA Exploration Atmosphere (56.5 kPa / 8.2 psi with 34% O₂) constitutes a critical deflagration hazard.

• Flammability Limits: H₂ possesses an exceptionally wide flammability range (4.0% - 75.0% in air, broadening to >85% in 34% O₂).
• Minimum Ignition Energy (MIE): MIE drops below 0.01 mJ, making electrostatic discharge from EVA garments sufficient to initiate deflagration.
• Combustion Dynamics: Lewis number Le < 1 triggers powerful diffusive-thermal cellular instabilities. In microgravity, absence of buoyant dissipation accelerates radial spherical flame front propagation.
• Countermeasures: Automatic rapid isolation of ECLSS oxygen manifolds, immediate cabin fan depower, and flooding with 10% vol FK-5-1-12 clean agent to depress adiabatic flame temperature below 1400 K.`;
    }
  }

  // 2. Water on space station fire / Why is throwing water dangerous
  if (
    (q.includes('water') && (q.includes('dangerous') || q.includes('throw') || q.includes('spray') || q.includes('hose') || q.includes('bad'))) ||
    q.includes('why water')
  ) {
    if (isBeginnerMode) {
      return `Captain's Warning: NEVER throw water on a space station fire! Here is why:

1. Floating Water Blobs: In zero gravity, water doesn't fall down into puddles. It breaks apart into thousands of floating, conductive liquid spheres that drift through the air like loose marbles.
2. Avionics Nightmare: Those floating water blobs get sucked into the spaceship's ventilation fans and splash directly onto million-dollar computer motherboards and life-support electronics, causing catastrophic short circuits and total blackout.
3. Steam Explosions: Trapped water against a 1,000°C fire flashes instantly into superheated steam, expanding 1,700 times in volume and blowing hot burning debris straight at the astronauts!
4. The Space Solution: We use heavy extinguishing gases (like FK-5-1-12) or microscopic water-mist droplets that instantly evaporate into steam without leaving a single drop of liquid!`;
    } else {
      return `Captain's Operational Doctrine: Liquid water discharge is strictly prohibited inside pressurized spacecraft modules (NASA-STD-6001 / SSP 50005).

• Surface Tension Dominated Multi-Phase Flow: In microgravity (Weber number We >> 1, Bond number Bo ≈ 0), bulk liquid jet momentum breaks into free-floating polydisperse droplets governed by Rayleigh-Plateau instabilities.
• Avionics Short-Circuiting: Dispersed conductive water droplets penetrate rack-mounted orbital replacement units (ORUs) and avionics chassis, triggering catastrophic dielectric breakdown.
• Thermal Expansion Volumetric Blast: Liquid water contacting high-temperature solid pyrolysis zones experiences rapid phase transition (1:1700 expansion ratio), producing steam overpressures that disperse burning fragment embers throughout the cabin.
• Aerospace Standard: Suppression utilizes FK-5-1-12 clean agent (zero residue, non-conductive) or fine water mist (droplet diameter < 100 µm) designed for instantaneous thermal vaporization without pooling.`;
    }
  }

  // 3. Birthday candle / Blow out a space fire
  if (
    (q.includes('blow') && (q.includes('candle') || q.includes('birthday') || q.includes('breath') || q.includes('mouth'))) ||
    q.includes('blow out')
  ) {
    if (isBeginnerMode) {
      return `Captain says: Do NOT try to blow out a space fire like a birthday candle! It will do the exact opposite!

• Why candles go out on Earth: When you blow hard on Earth, your breath physically pushes the flame away from the candle wick faster than the fuel can vaporize.
• Why it backfires in space: In zero gravity, a fire has no fresh air floating in, so it sits trapped inside its own cloud of carbon dioxide smoke, slowly starving itself to death.
• The Blowtorch Effect: If you blow your breath at a space fire, your breath acts like a giant blacksmith's bellows! You supply fresh oxygen and air currents, instantly transforming a peaceful, dying blue ball into an aggressive roaring blowtorch!
• Captain's Golden Rule: Don't blow on it—hit the fan kill switch and let the fire choke itself to death!`;
    } else {
      return `Captain's Combustion Dynamics Analysis: Attempting to aerodynamically blow out a microgravity diffusion flame induces dangerous convective intensification.

• Quiescent Self-Extinction: A zero-g flame operates under pure molecular diffusion (Péclet number Pe << 1). Combustion products (CO₂ and H₂O) accumulate in a spherical boundary layer around the reaction sheet, leading to self-induced radiative/thermal quenching.
• Forced Convection Ingress: Exhaling toward the flame introduces forced convective mass transfer (Reynolds number Re ~ 50-300). This strips the stagnant CO₂ blanket and forces fresh oxidizer across the pyrolysis surface.
• Flame Spread Acceleration: Experimental data from NASA BASS (Burning and Suppression of Solids) proves that convective velocities between 0.05 and 0.4 m/s increase solid flame spread velocity (V_f) by over 300%. The proper protocol is immediate cessation of all forced ventilation.`;
    }
  }

  // 4. Zero gravity meaning / What is zero gravity / microgravity
  if (
    q.includes('zero gravity') ||
    q.includes('zero-g') ||
    q.includes('microgravity') ||
    q.includes('what is zero') ||
    q.includes('meaning of zero')
  ) {
    if (isBeginnerMode) {
      return `Captain's Astronomy 101: What does "Zero Gravity" actually mean?

• The Big Myth: Most people think astronauts float because Earth's gravity disappears in space. That is completely FALSE! 250 miles above Earth (where the ISS orbits), Earth's gravity is still **90% as strong as right beneath your feet**!
• The Secret of Orbit: Astronauts float because they are in **perpetual freefall**! The space station is falling toward Earth, but it is moving sideways so ridiculously fast (17,500 miles per hour / 28,000 km/h) that the Earth curves away beneath it just as fast as it falls.
• Why Fire Changes: Because everything inside the spaceship is falling together at the exact same speed, you feel completely weightless. There is no heavy air and no light air. Hot air cannot float upward—which is why flames in space cannot form points and instead become calm, glowing blue spheres!`;
    } else {
      return `Captain's Orbital Mechanics & Gravitational Physics:

• Microgravity vs Null Gravity: Earth's gravitational acceleration at low Earth orbit (r = 6,700 km) is given by Newton's law: g_orbit = GM / r² ≈ 8.7 m/s² (~89% of surface 1G).
• Dynamic Freefall Equilibrium: Orbital freefall occurs when gravitational acceleration matches centripetal acceleration: v² / r = g_orbit. The orbital velocity of v ≈ 7.7 km/s maintains constant geodesic freefall.
• Combustion Impact: When the apparent net acceleration vector is nullified (g_eff ≈ 10⁻⁶ g), buoyancy-driven natural convection (governed by the Rayleigh number Ra = gβΔTL³ / να) completely drops to zero. Mass transport shifts exclusively to Fickian molecular diffusion and Stefan flow.`;
    }
  }

  // 5. Silane / Pyrophoric auto-ignition
  if (q.includes('silane') || q.includes('sih4') || q.includes('pyrophoric') || q.includes('glass')) {
    return `Captain's Hazard Briefing on Silane (SiH₄):
Silane is a pyrophoric monster! Unlike normal fuels, Silane does NOT need a spark, match, or hot wire to catch fire. The instant it leaks and touches oxygen, it spontaneously explodes into brilliant white-hot flames!
Even worse: normal fires make black carbon smoke, but burning Silane produces solid silicon dioxide (white glass dust!) that coats sensors, ruins space suits, and permanently clogs life-support air filters. It requires immediate inert gas (N₂ / Ar) compartment purging!`;
  }

  // 6. Ammonia coolant leak
  if (q.includes('ammonia') || q.includes('nh3') || q.includes('coolant') || q.includes('radiator')) {
    return `Captain's Emergency Analysis on Ammonia (NH₃):
Ammonia is used in the external cooling radiators on the space station to dump computer and human body heat into deep space. If an external radiator loop ruptures and leaks into the crew cabin:
1. It is violently corrosive and lethal to breathe within breaths—crew must don Emergency Breathing Apparatus (EBA) instantly!
2. If oxygen concentrations are elevated, Ammonia vapor catches fire with an eerie yellow-green flame, generating toxic nitrogen oxide (NOx) gases.`;
  }

  // 7. Apollo 1 fire
  if (q.includes('apollo') || q.includes('1967') || q.includes('grissom') || q.includes('pure oxygen')) {
    return `Captain's Spaceflight History Lesson: The Tragic Apollo 1 Disaster (Jan 27, 1967).
Astronauts Gus Grissom, Ed White, and Roger Chaffee were conducting a launchpad test inside Apollo 1. The cabin was pressurized with 100% pure oxygen at 16.7 psi.
When an electrical wire sparked under Grissom's seat, materials that would never burn on Earth (Velcro strips, suit nylon, plastic netting) detonated like gunpowder. The cabin became an uncontrollable inferno in under 15 seconds. This tragedy forced NASA to redesign Apollo hatches and taught humanity never to use high-pressure pure oxygen in spacecraft cabins!`;
  }

  // 8. Mir 1997 fire
  if (q.includes('mir') || q.includes('1997') || q.includes('vika') || q.includes('candle') || q.includes('russian')) {
    return `Captain's History File: The 1997 Mir Space Station Oxygen Generator Fire.
On February 23, 1997, cosmonaut Aleksandr Lazutkin lit a solid chemical oxygen canister ("Vika candle") inside Mir's Kvant-1 module. A defect caused the candle to crack open, spewing a 4-foot blowtorch flame into the module!
Because there was zero gravity, thick black smoke couldn't rise to the ceiling—it filled the entire module in seconds, blinding the 6 crew members. Even worse, the fire was blocking the entrance to one of the Soyuz escape capsules! The crew fought the blowtorch fire with heavy foam extinguishers for 90 agonizing seconds before finally suffocating it.`;
  }

  // 9. Cool flames / Saffire
  if (q.includes('cool flame') || q.includes('saffire') || q.includes('invisible') || q.includes('bass')) {
    return `Captain's Science Deep Dive: The Mystery of "Cool Flames"!
During NASA Saffire and FLEX combustion experiments aboard Cygnus freighters and the ISS, scientists made a startling discovery: after a droplet flame appeared to extinguish and go dark, thermal sensors showed it was still secretly burning!
These "cool diffusion flames" burn at only 400°C to 600°C (compared to 1,500°C for normal fire) without creating any visible light and zero black soot. On Earth, buoyant air cools them down too fast to survive, but in zero gravity, they can silently burn undetected for minutes!`;
  }

  // 10. Fire Extinguishers / FK-5-1-12 / Novec 1230 / CO2
  if (q.includes('extinguish') || q.includes('novec') || q.includes('fk-5') || q.includes('clean agent') || q.includes('put out')) {
    return `Captain's Guide to Space Firefighting Extinguishers:
In space, you cannot use water hoses or powder extinguishers that fill the cabin with dust astronauts could choke on. We rely on two primary weapons:
1. FK-5-1-12 (Clean Agent / Novec 1230): An engineered heavy fluoroketone gas that absorbs heat with incredible speed. It freezes the flame's chemical reaction in seconds without leaving a single drop of liquid residue on spacecraft computers.
2. Carbon Dioxide (CO₂) Extinguishers: Smothers the flame by depriving it of oxygen. Crew must wear oxygen masks when deploying CO₂ to prevent suffocating in their own cabin!`;
  }

  // 11. Moon / Mars gravity fire behavior
  if (q.includes('moon') || q.includes('mars') || q.includes('0.16') || q.includes('0.38')) {
    return `Captain's Planetary Combustion Report:
• Lunar Gravity (0.16g): On the Moon, gravity is only 1/6th of Earth. Buoyancy is weak, meaning flames burn fatter, lazier, and flicker at a sluggish 3 Hz (compared to 15 Hz on Earth).
• Martian Gravity (0.38g): On Mars, flames are transitional—faster than in deep space, but far slower than on Earth.
• The Habitats: Because Moon and Mars habitats will use lower cabin pressures with higher oxygen (Artemis Exploration Atmosphere: 34% O₂ at 8.2 psi), solid fabrics and wiring catch fire much faster than in ordinary Earth rooms!`;
  }

  // 12. Fans / Ventilation importance
  if (q.includes('fan') || q.includes('ventilation') || q.includes('air current') || q.includes('breeze')) {
    return `Captain's Tactical Rule #1: Why Fans are the Key to Space Fire Survival.
Without gravity, hot air doesn't rise. A flame quickly consumes all oxygen within a 2-centimeter bubble and chokes in its own exhaled carbon dioxide smoke.
However, spacecraft air conditioning fans are constantly blowing air so astronauts don't suffocate in their sleep. Those very fans supply fresh oxygen to the fire, turning a quiet sphere into a raging blowtorch!
That's why an astronaut's very first action in an alarm is NOT fighting the fire—it is immediately shutting down module ventilation fans!`;
  }

  // 13. Dynamic contextual synthesis based on current chamber state
  return `Captain's Real-Time Tactical Scan of Your Chamber:

• Atmospheric Pressure: ${p.toFixed(1)} kPa (${(p * 0.145).toFixed(1)} psi)
• Oxygen Level: ${o2.toFixed(1)}% | Hydrogen: ${h2.toFixed(1)}% | Methane: ${ch4.toFixed(1)}%
• Gravitational Field: ${g === 0 ? '0.00g (Microgravity)' : `${g.toFixed(2)}g`}
• Ventilation Flow: ${vent.toFixed(2)} m/s | Active Fuel: ${fuel}

Captain's Assessment:
${
  o2 < 11
    ? 'The atmosphere is currently sub-critical (<11% O₂). Combustion cannot chemically sustain itself and any spark will instantly extinguish.'
    : h2 > 4
    ? 'CRITICAL WARNING: Elevated Hydrogen levels detected! High risk of an invisible pale UV-blue deflagration. Keep spark sources isolated!'
    : g === 0
    ? vent === 0
      ? 'In this stagnant zero-g air, any ignited flame will form a quiet blue sphere and self-suffocate in its own smoke within seconds.'
      : 'With cabin fans active, forced airflow is stretching the zero-g flame sphere into an asymmetric wake, continually feeding it oxygen!'
    : 'Under active gravity, buoyant convection is pulling hot gases upward, resulting in a classic flickering pointed teardrop flame.'
}

Ask me anything else: questions about Apollo 1, Mir, why water is banned, or test different gas leaks in the mixer!`;
}
