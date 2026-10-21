// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

// src/services/captainIntelligence.ts
function generateCaptainResponse(question, chamberState, isBeginnerMode = true) {
  const q = (question || "").toLowerCase().trim();
  const o2 = chamberState?.gases?.O2 ?? 21;
  const h2 = chamberState?.gases?.H2 ?? 0;
  const ch4 = chamberState?.gases?.CH4 ?? 0;
  const sih4 = chamberState?.gases?.SiH4 ?? 0;
  const nh3 = chamberState?.gases?.NH3 ?? 0;
  const g = chamberState?.gravityG ?? 0;
  const p = chamberState?.pressureKpa ?? 101.3;
  const vent = chamberState?.ventilationSpeed ?? 0.15;
  const fuel = chamberState?.fuelType || "Kapton Wiring";
  if ((q.includes("hydrogen") || q.includes("h2")) && (q.includes("artemis") || q.includes("34%") || q.includes("leak") || q.includes("cabin"))) {
    if (isBeginnerMode) {
      return `Captain's Emergency Briefing: A Hydrogen leak in the Artemis 34% oxygen cabin is the ultimate nightmare scenario!

\u2022 The Ghost Danger: Hydrogen burns with an almost invisible, pale ultra-violet flame. Astronauts wouldn't see smoke or bright orange fire until their equipment literally starts melting!
\u2022 The Oxygen Supercharger: Standard air is only 21% oxygen. At 34% oxygen, ordinary things catch fire instantly, and Hydrogen needs less energy than a tiny static shock from your wool sock to explode.
\u2022 Zero-G Shockwave: Without gravity, the fire expands outward as a blistering hot sphere, creating an explosive pressure wave.
\u2022 Captain's Protocol: 1. Hit the emergency fan kill switch immediately. 2. Seal the compartment hatch. 3. Flood with FK-5-1-12 clean agent gas!`;
    } else {
      return `Captain's Technical Evaluation: H\u2082 leakage into the NASA Exploration Atmosphere (56.5 kPa / 8.2 psi with 34% O\u2082) constitutes a critical deflagration hazard.

\u2022 Flammability Limits: H\u2082 possesses an exceptionally wide flammability range (4.0% - 75.0% in air, broadening to >85% in 34% O\u2082).
\u2022 Minimum Ignition Energy (MIE): MIE drops below 0.01 mJ, making electrostatic discharge from EVA garments sufficient to initiate deflagration.
\u2022 Combustion Dynamics: Lewis number Le < 1 triggers powerful diffusive-thermal cellular instabilities. In microgravity, absence of buoyant dissipation accelerates radial spherical flame front propagation.
\u2022 Countermeasures: Automatic rapid isolation of ECLSS oxygen manifolds, immediate cabin fan depower, and flooding with 10% vol FK-5-1-12 clean agent to depress adiabatic flame temperature below 1400 K.`;
    }
  }
  if (q.includes("water") && (q.includes("dangerous") || q.includes("throw") || q.includes("spray") || q.includes("hose") || q.includes("bad")) || q.includes("why water")) {
    if (isBeginnerMode) {
      return `Captain's Warning: NEVER throw water on a space station fire! Here is why:

1. Floating Water Blobs: In zero gravity, water doesn't fall down into puddles. It breaks apart into thousands of floating, conductive liquid spheres that drift through the air like loose marbles.
2. Avionics Nightmare: Those floating water blobs get sucked into the spaceship's ventilation fans and splash directly onto million-dollar computer motherboards and life-support electronics, causing catastrophic short circuits and total blackout.
3. Steam Explosions: Trapped water against a 1,000\xB0C fire flashes instantly into superheated steam, expanding 1,700 times in volume and blowing hot burning debris straight at the astronauts!
4. The Space Solution: We use heavy extinguishing gases (like FK-5-1-12) or microscopic water-mist droplets that instantly evaporate into steam without leaving a single drop of liquid!`;
    } else {
      return `Captain's Operational Doctrine: Liquid water discharge is strictly prohibited inside pressurized spacecraft modules (NASA-STD-6001 / SSP 50005).

\u2022 Surface Tension Dominated Multi-Phase Flow: In microgravity (Weber number We >> 1, Bond number Bo \u2248 0), bulk liquid jet momentum breaks into free-floating polydisperse droplets governed by Rayleigh-Plateau instabilities.
\u2022 Avionics Short-Circuiting: Dispersed conductive water droplets penetrate rack-mounted orbital replacement units (ORUs) and avionics chassis, triggering catastrophic dielectric breakdown.
\u2022 Thermal Expansion Volumetric Blast: Liquid water contacting high-temperature solid pyrolysis zones experiences rapid phase transition (1:1700 expansion ratio), producing steam overpressures that disperse burning fragment embers throughout the cabin.
\u2022 Aerospace Standard: Suppression utilizes FK-5-1-12 clean agent (zero residue, non-conductive) or fine water mist (droplet diameter < 100 \xB5m) designed for instantaneous thermal vaporization without pooling.`;
    }
  }
  if (q.includes("blow") && (q.includes("candle") || q.includes("birthday") || q.includes("breath") || q.includes("mouth")) || q.includes("blow out")) {
    if (isBeginnerMode) {
      return `Captain says: Do NOT try to blow out a space fire like a birthday candle! It will do the exact opposite!

\u2022 Why candles go out on Earth: When you blow hard on Earth, your breath physically pushes the flame away from the candle wick faster than the fuel can vaporize.
\u2022 Why it backfires in space: In zero gravity, a fire has no fresh air floating in, so it sits trapped inside its own cloud of carbon dioxide smoke, slowly starving itself to death.
\u2022 The Blowtorch Effect: If you blow your breath at a space fire, your breath acts like a giant blacksmith's bellows! You supply fresh oxygen and air currents, instantly transforming a peaceful, dying blue ball into an aggressive roaring blowtorch!
\u2022 Captain's Golden Rule: Don't blow on it\u2014hit the fan kill switch and let the fire choke itself to death!`;
    } else {
      return `Captain's Combustion Dynamics Analysis: Attempting to aerodynamically blow out a microgravity diffusion flame induces dangerous convective intensification.

\u2022 Quiescent Self-Extinction: A zero-g flame operates under pure molecular diffusion (P\xE9clet number Pe << 1). Combustion products (CO\u2082 and H\u2082O) accumulate in a spherical boundary layer around the reaction sheet, leading to self-induced radiative/thermal quenching.
\u2022 Forced Convection Ingress: Exhaling toward the flame introduces forced convective mass transfer (Reynolds number Re ~ 50-300). This strips the stagnant CO\u2082 blanket and forces fresh oxidizer across the pyrolysis surface.
\u2022 Flame Spread Acceleration: Experimental data from NASA BASS (Burning and Suppression of Solids) proves that convective velocities between 0.05 and 0.4 m/s increase solid flame spread velocity (V_f) by over 300%. The proper protocol is immediate cessation of all forced ventilation.`;
    }
  }
  if (q.includes("zero gravity") || q.includes("zero-g") || q.includes("microgravity") || q.includes("what is zero") || q.includes("meaning of zero")) {
    if (isBeginnerMode) {
      return `Captain's Astronomy 101: What does "Zero Gravity" actually mean?

\u2022 The Big Myth: Most people think astronauts float because Earth's gravity disappears in space. That is completely FALSE! 250 miles above Earth (where the ISS orbits), Earth's gravity is still **90% as strong as right beneath your feet**!
\u2022 The Secret of Orbit: Astronauts float because they are in **perpetual freefall**! The space station is falling toward Earth, but it is moving sideways so ridiculously fast (17,500 miles per hour / 28,000 km/h) that the Earth curves away beneath it just as fast as it falls.
\u2022 Why Fire Changes: Because everything inside the spaceship is falling together at the exact same speed, you feel completely weightless. There is no heavy air and no light air. Hot air cannot float upward\u2014which is why flames in space cannot form points and instead become calm, glowing blue spheres!`;
    } else {
      return `Captain's Orbital Mechanics & Gravitational Physics:

\u2022 Microgravity vs Null Gravity: Earth's gravitational acceleration at low Earth orbit (r = 6,700 km) is given by Newton's law: g_orbit = GM / r\xB2 \u2248 8.7 m/s\xB2 (~89% of surface 1G).
\u2022 Dynamic Freefall Equilibrium: Orbital freefall occurs when gravitational acceleration matches centripetal acceleration: v\xB2 / r = g_orbit. The orbital velocity of v \u2248 7.7 km/s maintains constant geodesic freefall.
\u2022 Combustion Impact: When the apparent net acceleration vector is nullified (g_eff \u2248 10\u207B\u2076 g), buoyancy-driven natural convection (governed by the Rayleigh number Ra = g\u03B2\u0394TL\xB3 / \u03BD\u03B1) completely drops to zero. Mass transport shifts exclusively to Fickian molecular diffusion and Stefan flow.`;
    }
  }
  if (q.includes("silane") || q.includes("sih4") || q.includes("pyrophoric") || q.includes("glass")) {
    return `Captain's Hazard Briefing on Silane (SiH\u2084):
Silane is a pyrophoric monster! Unlike normal fuels, Silane does NOT need a spark, match, or hot wire to catch fire. The instant it leaks and touches oxygen, it spontaneously explodes into brilliant white-hot flames!
Even worse: normal fires make black carbon smoke, but burning Silane produces solid silicon dioxide (white glass dust!) that coats sensors, ruins space suits, and permanently clogs life-support air filters. It requires immediate inert gas (N\u2082 / Ar) compartment purging!`;
  }
  if (q.includes("ammonia") || q.includes("nh3") || q.includes("coolant") || q.includes("radiator")) {
    return `Captain's Emergency Analysis on Ammonia (NH\u2083):
Ammonia is used in the external cooling radiators on the space station to dump computer and human body heat into deep space. If an external radiator loop ruptures and leaks into the crew cabin:
1. It is violently corrosive and lethal to breathe within breaths\u2014crew must don Emergency Breathing Apparatus (EBA) instantly!
2. If oxygen concentrations are elevated, Ammonia vapor catches fire with an eerie yellow-green flame, generating toxic nitrogen oxide (NOx) gases.`;
  }
  if (q.includes("apollo") || q.includes("1967") || q.includes("grissom") || q.includes("pure oxygen")) {
    return `Captain's Spaceflight History Lesson: The Tragic Apollo 1 Disaster (Jan 27, 1967).
Astronauts Gus Grissom, Ed White, and Roger Chaffee were conducting a launchpad test inside Apollo 1. The cabin was pressurized with 100% pure oxygen at 16.7 psi.
When an electrical wire sparked under Grissom's seat, materials that would never burn on Earth (Velcro strips, suit nylon, plastic netting) detonated like gunpowder. The cabin became an uncontrollable inferno in under 15 seconds. This tragedy forced NASA to redesign Apollo hatches and taught humanity never to use high-pressure pure oxygen in spacecraft cabins!`;
  }
  if (q.includes("mir") || q.includes("1997") || q.includes("vika") || q.includes("candle") || q.includes("russian")) {
    return `Captain's History File: The 1997 Mir Space Station Oxygen Generator Fire.
On February 23, 1997, cosmonaut Aleksandr Lazutkin lit a solid chemical oxygen canister ("Vika candle") inside Mir's Kvant-1 module. A defect caused the candle to crack open, spewing a 4-foot blowtorch flame into the module!
Because there was zero gravity, thick black smoke couldn't rise to the ceiling\u2014it filled the entire module in seconds, blinding the 6 crew members. Even worse, the fire was blocking the entrance to one of the Soyuz escape capsules! The crew fought the blowtorch fire with heavy foam extinguishers for 90 agonizing seconds before finally suffocating it.`;
  }
  if (q.includes("cool flame") || q.includes("saffire") || q.includes("invisible") || q.includes("bass")) {
    return `Captain's Science Deep Dive: The Mystery of "Cool Flames"!
During NASA Saffire and FLEX combustion experiments aboard Cygnus freighters and the ISS, scientists made a startling discovery: after a droplet flame appeared to extinguish and go dark, thermal sensors showed it was still secretly burning!
These "cool diffusion flames" burn at only 400\xB0C to 600\xB0C (compared to 1,500\xB0C for normal fire) without creating any visible light and zero black soot. On Earth, buoyant air cools them down too fast to survive, but in zero gravity, they can silently burn undetected for minutes!`;
  }
  if (q.includes("extinguish") || q.includes("novec") || q.includes("fk-5") || q.includes("clean agent") || q.includes("put out")) {
    return `Captain's Guide to Space Firefighting Extinguishers:
In space, you cannot use water hoses or powder extinguishers that fill the cabin with dust astronauts could choke on. We rely on two primary weapons:
1. FK-5-1-12 (Clean Agent / Novec 1230): An engineered heavy fluoroketone gas that absorbs heat with incredible speed. It freezes the flame's chemical reaction in seconds without leaving a single drop of liquid residue on spacecraft computers.
2. Carbon Dioxide (CO\u2082) Extinguishers: Smothers the flame by depriving it of oxygen. Crew must wear oxygen masks when deploying CO\u2082 to prevent suffocating in their own cabin!`;
  }
  if (q.includes("moon") || q.includes("mars") || q.includes("0.16") || q.includes("0.38")) {
    return `Captain's Planetary Combustion Report:
\u2022 Lunar Gravity (0.16g): On the Moon, gravity is only 1/6th of Earth. Buoyancy is weak, meaning flames burn fatter, lazier, and flicker at a sluggish 3 Hz (compared to 15 Hz on Earth).
\u2022 Martian Gravity (0.38g): On Mars, flames are transitional\u2014faster than in deep space, but far slower than on Earth.
\u2022 The Habitats: Because Moon and Mars habitats will use lower cabin pressures with higher oxygen (Artemis Exploration Atmosphere: 34% O\u2082 at 8.2 psi), solid fabrics and wiring catch fire much faster than in ordinary Earth rooms!`;
  }
  if (q.includes("fan") || q.includes("ventilation") || q.includes("air current") || q.includes("breeze")) {
    return `Captain's Tactical Rule #1: Why Fans are the Key to Space Fire Survival.
Without gravity, hot air doesn't rise. A flame quickly consumes all oxygen within a 2-centimeter bubble and chokes in its own exhaled carbon dioxide smoke.
However, spacecraft air conditioning fans are constantly blowing air so astronauts don't suffocate in their sleep. Those very fans supply fresh oxygen to the fire, turning a quiet sphere into a raging blowtorch!
That's why an astronaut's very first action in an alarm is NOT fighting the fire\u2014it is immediately shutting down module ventilation fans!`;
  }
  return `Captain's Real-Time Tactical Scan of Your Chamber:

\u2022 Atmospheric Pressure: ${p.toFixed(1)} kPa (${(p * 0.145).toFixed(1)} psi)
\u2022 Oxygen Level: ${o2.toFixed(1)}% | Hydrogen: ${h2.toFixed(1)}% | Methane: ${ch4.toFixed(1)}%
\u2022 Gravitational Field: ${g === 0 ? "0.00g (Microgravity)" : `${g.toFixed(2)}g`}
\u2022 Ventilation Flow: ${vent.toFixed(2)} m/s | Active Fuel: ${fuel}

Captain's Assessment:
${o2 < 11 ? "The atmosphere is currently sub-critical (<11% O\u2082). Combustion cannot chemically sustain itself and any spark will instantly extinguish." : h2 > 4 ? "CRITICAL WARNING: Elevated Hydrogen levels detected! High risk of an invisible pale UV-blue deflagration. Keep spark sources isolated!" : g === 0 ? vent === 0 ? "In this stagnant zero-g air, any ignited flame will form a quiet blue sphere and self-suffocate in its own smoke within seconds." : "With cabin fans active, forced airflow is stretching the zero-g flame sphere into an asymmetric wake, continually feeding it oxygen!" : "Under active gravity, buoyant convection is pulling hot gases upward, resulting in a classic flickering pointed teardrop flame."}

Ask me anything else: questions about Apollo 1, Mir, why water is banned, or test different gas leaks in the mixer!`;
}

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = parseInt(process.env.PORT || "3000", 10);
app.use(express.json());
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function generateLocalFireAnalysis(data) {
  const { gases, pressureKpa, gravityG, ventilationSpeed, fuelType } = data;
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const c3h8 = gases?.C3H8 || 0;
  const c2h4 = gases?.C2H4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const nh3 = gases?.NH3 || 0;
  const co = gases?.CO || 0;
  const co2 = gases?.CO2 || 0;
  const sf6 = gases?.SF6 || 0;
  const novec = gases?.Novec || 0;
  const kr = gases?.Kr || 0;
  const he = gases?.He || 0;
  let dangerLevel = "NOMINAL";
  let riskScore = 15;
  let flameBehavior = "No sustainable combustion";
  let summarySimple = "The atmosphere is inert or lacks sufficient oxygen to support combustion.";
  let scientificInterpretation = "Oxygen concentration is below the Limiting Oxygen Index (LOI). Radical chain branching cannot overcome thermal conduction loss.";
  if (novec > 5 || sf6 > 8 || co2 > 35) {
    dangerLevel = "EXTINGUISHED";
    riskScore = 5;
    summarySimple = "Fire is smothered! Heavy molecular gas (FK-5-1-12 / SF\u2086 / CO\u2082) absorbs heat and chokes out the flame.";
    flameBehavior = "Immediate thermal quench and suppression. Zero visible reaction.";
    scientificInterpretation = "High molar heat capacity of diluents depresses the adiabatic flame temperature below the extinction limit (~1400 K).";
  } else if (sih4 > 1.5 && o2 > 10) {
    dangerLevel = "EXTREME";
    riskScore = 100;
    summarySimple = "CRITICAL PYROPHORIC EVENT: Silane gas ignites spontaneously upon touching oxygen with zero spark needed!";
    flameBehavior = "Self-igniting brilliant white incandescent fireball generating dense clouds of solid silica (glass) particles.";
    scientificInterpretation = "Pyrophoric auto-ignition: negative activation barrier for SiH4 + O2 branching reactions. Spontaneous deflagration without external ignition source.";
  } else if (o2 < 11) {
    dangerLevel = "EXTINGUISHED";
    riskScore = 10;
    summarySimple = "Fire cannot breathe! Oxygen is under 11%, which is below what a flame needs to survive in space.";
    flameBehavior = "Instant smolder extinction. Weak chemiluminescent flicker for milliseconds then dark.";
    scientificInterpretation = "Sub-critical oxygen index. In zero-g without buoyant oxidizer replenishment, the reaction zone cools rapidly.";
  } else if (h2 > 4 && o2 > 14) {
    dangerLevel = "EXTREME";
    riskScore = 96;
    summarySimple = "CRITICAL DANGER: Invisible ghost bomb! Hydrogen leaks create a nearly invisible, scorching flame that can detonate with the tiniest spark.";
    flameBehavior = "Invisible, pale ultra-violet blue spherical fireball. Extreme heat propagation without smoke.";
    scientificInterpretation = "Wide flammability envelope (4-75% H2 in air) combined with extremely low Lewis number (Le < 1). Diffusive-thermal instabilities cause rapid flame front acceleration.";
  } else if (nh3 > 15 && o2 > 18) {
    dangerLevel = "HIGH";
    riskScore = 84;
    summarySimple = "TOXIC FIRE: Ammonia radiator leak burning with a yellow-green hue, generating deadly respiratory gases!";
    flameBehavior = "Faint yellow-green spherical flame with heavy corrosive vapor halo.";
    scientificInterpretation = "Narrow flammability limit (15-28% NH3 in air). Combustion yields nitrogen oxides (NOx) and toxic unburned ammonia fumes.";
  } else if ((c3h8 > 2 || c2h4 > 2.5) && o2 > 14) {
    dangerLevel = "HIGH";
    riskScore = 86;
    summarySimple = "Hydrocarbon fire (Propane/Ethylene) spewing thick soot flakes that float around in zero-g!";
    flameBehavior = "Vibrant golden-orange flame with thick agglomerated soot clouds suspended in the air.";
    scientificInterpretation = "Unsaturated/dense hydrocarbon pyrolysis yields intense carbon soot luminescence. In zero-g, soot fails to settle and clogs air filters.";
  } else if (o2 > 30) {
    dangerLevel = "EXTREME";
    riskScore = o2 > 80 ? 99 : 88;
    summarySimple = "FLASH FIRE RISK: High oxygen makes almost everything burn like gunpowder, similar to the tragic Apollo 1 conditions.";
    flameBehavior = "Violent, brilliant white-hot flame with rapid surface flame spread velocity.";
    scientificInterpretation = "Elevated partial pressure of oxygen drastically lowers activation energy barriers and accelerates solid-phase pyrolysis.";
  } else if (ch4 > 5 && o2 > 12) {
    dangerLevel = "HIGH";
    riskScore = 82;
    summarySimple = "Methane leak detected! High combustion hazard with radiant blue core and heavy soot formation.";
    flameBehavior = "Bright azure blue spherical mantle with yellow incandescent soot cap.";
    scientificInterpretation = "Hydrocarbon diffusion flame. In microgravity, absence of buoyancy allows soot particles to aggregate into larger fractal clusters.";
  } else if (o2 >= 18) {
    if (gravityG === 0) {
      if (ventilationSpeed < 0.05) {
        dangerLevel = "ELEVATED";
        riskScore = 48;
        summarySimple = "A quiet, glowing blue sphere forms! With zero fan air, the flame will slowly choke on its own smoke bubble.";
        flameBehavior = "Symmetric, quiet glowing blue sphere (~2.5 cm diameter) with gentle radial diffusion.";
        scientificInterpretation = "Pure diffusive transport. Combustion products (CO2, H2O) accumulate spherically around the reaction zone, creating self-extinguishing suffocation unless ventilated.";
      } else {
        dangerLevel = "HIGH";
        riskScore = 70;
        summarySimple = "Spacecraft fans are feeding the flame! The airflow turns the quiet sphere into an elongated blowtorch.";
        flameBehavior = "Asymmetric teardrop flame trailing downwind from the forced ventilation fan vector.";
        scientificInterpretation = "Forced convection (Reynolds number Re ~ 50-200) renews oxidizer delivery to the reaction sheet, sustaining vigorous smoldering and flame spread.";
      }
    } else {
      dangerLevel = "ELEVATED";
      riskScore = 55;
      summarySimple = "Earth-like buoyant flame: hot air rises and pulls in fresh oxygen, creating a flickering candle shape.";
      flameBehavior = "Classic buoyant teardrop flame flickering at 10-15 Hz with a bright yellow soot plume.";
      scientificInterpretation = "Buoyancy-induced natural convection dominates (Grashof number Gr >> 1), evacuating exhaust upward and accelerating air ingress.";
    }
  }
  const rankedHazards = [
    {
      title: dangerLevel === "EXTREME" ? "Flash Deflagration / Explosion" : "Atmospheric Suffocation & Oxygen Depletion",
      severity: dangerLevel === "EXTREME" ? "CRITICAL" : "HIGH",
      description: "Rapid consumption of cabin breathable oxygen and potential thermal shock to life support hull."
    },
    {
      title: "Toxic Carbon Monoxide (CO) & Cyanide Offgassing",
      severity: "HIGH",
      description: `Thermal decomposition of ${fuelType || "wiring and cabin materials"} generates lethal CO and particulates without buoyant smoke chimneying.`
    },
    {
      title: "Sensor Blindness & Invisible Thermal Pockets",
      severity: gravityG === 0 ? "HIGH" : "MEDIUM",
      description: "In zero-g, smoke alarms that rely on rising smoke plumes fail to trigger early. Astronauts may physically walk into hot gas bubbles."
    },
    {
      title: "Avionics & ECLSS Corrosion",
      severity: "MEDIUM",
      description: "Soot particulates in microgravity remain suspended indefinitely in cabin air instead of falling to the floor."
    }
  ];
  const astronautProtocol = [
    "IMMEDIATE: Shut down module ventilation and circulation fans to stop oxygen delivery to the flame.",
    "EVACUATION: Don emergency oxygen mask (EBA) immediately to prevent inhalation of invisible CO.",
    "ISOLATION: Seal module pressure hatch to contain toxic thermal gases and preserve main station atmosphere.",
    "SUPPRESSION: Deploy portable FK-5-1-12 clean agent or Fine Water Mist extinguisher directly at the fuel base."
  ];
  return {
    dangerLevel,
    riskScore,
    summarySimple,
    scientificInterpretation,
    flameBehavior,
    rankedHazards,
    astronautProtocol,
    historicalPrecedent: o2 > 30 ? "Apollo 1 (1967): Pure 100% O2 cabin atmosphere at 16.7 psi caused instantaneous fatal flash fire from a single wire arc." : gravityG === 0 ? "Mir Space Station (1997): Solid fuel oxygen generator (Vika candle) ignited a blowtorch flame in zero gravity, blocking escape paths." : "NASA Saffire & BASS experiments: Confirmed microgravity flames burn cooler, expand spherically, and rely entirely on ventilation to survive."
  };
}
app.post("/api/si/analyze-fire-safety", async (req, res) => {
  try {
    const { gases, pressureKpa, gravityG, ventilationSpeed, fuelType, isBeginnerMode } = req.body;
    if (!ai) {
      return res.json(generateLocalFireAnalysis(req.body));
    }
    const prompt = `You are the onboard Spaceflight Fire Safety Super Intelligence (SI) evaluating spacecraft atmosphere conditions:
Parameters:
- Gas Composition (Volume %): ${JSON.stringify(gases)}
- Cabin Pressure: ${pressureKpa} kPa (${(pressureKpa * 0.145038).toFixed(1)} psi)
- Gravity: ${gravityG} g (${gravityG === 0 ? "Zero-G Microgravity" : gravityG === 0.16 ? "Lunar Surface" : gravityG === 0.38 ? "Mars Surface" : "Earth 1G"})
- Air Ventilation / Fan Speed: ${ventilationSpeed} m/s
- Fuel Source: ${fuelType}
- Target Audience Level: ${isBeginnerMode ? "Layperson / Space Cadet (make explanations simple, fun, using relatable everyday analogies like campfires, blankets, soup)" : "Aerospace Engineer & Mission Commander"}

Provide a structured fire safety risk assessment with:
1. dangerLevel: One of "EXTREME", "HIGH", "ELEVATED", "NOMINAL", "EXTINGUISHED"
2. riskScore: 0 to 100
3. summarySimple: A crystal-clear, plain-English summary (1-2 sentences) understandable to someone with ZERO astronomy knowledge.
4. scientificInterpretation: Detailed combustion physics (mention buoyant vs diffusive transport, Limiting Oxygen Index, quenching distance).
5. flameBehavior: Physical appearance and shape (spherical vs teardrop, color, soot shells, radical emission).
6. rankedHazards: Array of objects with { title, severity ("CRITICAL"|"HIGH"|"MEDIUM"|"LOW"), description } ranked in priority order.
7. astronautProtocol: Array of 4 prioritized emergency action steps for astronauts.
8. historicalPrecedent: A relevant real-world spaceflight historical context (e.g., Apollo 1, Mir 1997 fire, NASA Saffire Cygnus experiments, BASS, FLEX).`;
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Gemini API timeout")), 12e3)
    );
    const apiPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dangerLevel: { type: Type.STRING },
            riskScore: { type: Type.NUMBER },
            summarySimple: { type: Type.STRING },
            scientificInterpretation: { type: Type.STRING },
            flameBehavior: { type: Type.STRING },
            rankedHazards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "severity", "description"]
              }
            },
            astronautProtocol: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            historicalPrecedent: { type: Type.STRING }
          },
          required: [
            "dangerLevel",
            "riskScore",
            "summarySimple",
            "scientificInterpretation",
            "flameBehavior",
            "rankedHazards",
            "astronautProtocol",
            "historicalPrecedent"
          ]
        }
      }
    });
    const response = await Promise.race([apiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error) {
    console.log("Gemini notice, activating local model:", error?.message || error);
    return res.json(generateLocalFireAnalysis(req.body));
  }
});
app.post("/api/si/ask-commander", async (req, res) => {
  try {
    const { question, chamberState, isBeginnerMode } = req.body;
    const hasValidKey = apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.length > 10;
    if (ai && hasValidKey) {
      const systemPrompt = `You are Captain, the world's most advanced aerospace fire safety Super Intelligence stationed aboard a deep space exploration cruiser.
Your name is Captain. Your mission is to explain complex microgravity combustion, spacecraft fire safety, and atmospheric gas chemistry to human astronauts and space cadets.
Style guidelines:
- If isBeginnerMode is true: Explain using simple everyday analogies (campfires, blowing out candles, blankets, soup, vacuum cleaners). Avoid confusing jargon without immediate explanation. Be engaging, clear, and inspiring.
- If isBeginnerMode is false: Provide rigorous aerospace combustion thermodynamics (buoyancy Grashof number, Lewis numbers, LOI, Saffire findings, NASA-STD-6001).
- Keep answers concise, highly informative, and actionable (under 200 words).
- Introduce yourself or sign off as Captain.`;
      const timeoutPromise = new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Ask Commander timeout")), 1e4)
      );
      const apiPromise = ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Current Chamber State: ${JSON.stringify(chamberState)}
User Question: "${question}"`,
        config: {
          systemInstruction: systemPrompt
        }
      });
      const response = await Promise.race([apiPromise, timeoutPromise]);
      if (response && response.text) {
        return res.json({ answer: response.text });
      }
    }
    const captainAnswer = generateCaptainResponse(question, chamberState, isBeginnerMode);
    return res.json({ answer: captainAnswer });
  } catch (error) {
    console.log("Ask Commander notice, activating Captain local response:", error?.message || error);
    const captainAnswer = generateCaptainResponse(req.body.question, req.body.chamberState, req.body.isBeginnerMode);
    return res.json({ answer: captainAnswer });
  }
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
        // HMR is disabled in AI Studio to prevent WebSocket connection errors
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`\u{1F680} NULL-G Fire Safety SI Server running on http://0.0.0.0:${port}`);
  });
}
startServer();
