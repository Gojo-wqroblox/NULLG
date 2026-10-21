import { PresentationSlide } from '../types';

export const PRESENTATION_SLIDES: PresentationSlide[] = [
  {
    id: 1,
    badge: 'Introduction & Core Concept',
    title: 'Why Fire in Space is Bizarre & Deadly',
    subtitle: 'Zero Gravity changes the very laws of combustion',
    analogyTitle: 'The Hot Air Balloon Analogy',
    analogyContent: 'On Earth, a hot air balloon floats up into the sky because hot air is lighter than cold air. The same thing happens to a candle flame: hot gases rush upward, pulling fresh cold oxygen into the bottom, making the flame pointy and tall! But in space, there is no gravity, so hot air has nowhere to float. Fire becomes a perfect, glowing blue sphere!',
    technicalDepth: 'Buoyancy-driven natural convection is governed by the Grashof number (Gr ∝ g). When g = 0, buoyant convection vanishes completely. Transport shifts from convective to pure molecular diffusion.',
    points: [
      {
        title: 'No "Up" or "Down"',
        detail: 'Without gravity, heat cannot rise. Flames expand evenly in every direction like an inflating balloon.',
        tag: '0-G Physics',
      },
      {
        title: 'The Glowing Blue Sphere',
        detail: 'Instead of yellow flickering points, microgravity flames are dim, quiet, spherical blue halos.',
        tag: 'Visual Signature',
      },
      {
        title: 'Trapped in a Smoke Bubble',
        detail: 'Combustion products (CO₂ and water vapor) stay right next to the flame, slowly suffocating it.',
        tag: 'Self-Extinction',
      },
    ],
    visualHint: 'sphere_vs_teardrop',
    takeaway: 'Without buoyancy, a fire in zero gravity will naturally suffocate itself—unless the spaceship’s air conditioning fans blow fresh oxygen toward it!',
  },
  {
    id: 2,
    badge: 'Convection & Fans',
    title: 'The Spacecraft Air Conditioning Trap',
    subtitle: 'Why spaceship fans are fire’s best friend',
    analogyTitle: 'Blowing on Soup vs Fanning a Campfire',
    analogyContent: 'If you leave hot soup alone, it stays hot. If you blow on it, fresh air circulates. In a spaceship, astronauts need fans to circulate air so they don’t suffocate in their own exhaled carbon dioxide while sleeping. However, those very same fans act like a giant bellows fanning a campfire, turning a peaceful blue flame sphere into an aggressive blowtorch!',
    technicalDepth: 'Forced convection with Reynolds numbers Re ~ 10-300 disrupts the spherical diffusion boundary layer, creating an asymmetric tail and accelerating the surface flame spread rate (V_f).',
    points: [
      {
        title: 'Stagnant Space Fire Dies',
        detail: 'With ventilation off (0.00 m/s), oxygen is quickly exhausted within the local radius, and the flame dies in seconds.',
        tag: 'Golden Rule',
      },
      {
        title: 'Forced Air Keeps It Alive',
        detail: 'Even tiny ventilation breezes (0.1 to 0.2 m/s) deliver endless fresh oxygen to the reaction zone.',
        tag: 'Ventilation Danger',
      },
      {
        title: 'Smoke Does Not Rise to Alarms',
        detail: 'Earth smoke detectors are placed on ceilings because smoke rises. On the space station, smoke goes wherever fans push it!',
        tag: 'Detection Challenge',
      },
    ],
    visualHint: 'sphere_vs_teardrop',
    takeaway: 'Rule #1 in a space fire: Astronauts NEVER try to blow out the fire—they immediately hit the emergency switch to cut ALL ventilation fans!',
  },
  {
    id: 3,
    badge: 'Historic Disaster Analysis',
    title: 'Blood on the Launch Pad: Apollo 1 & Mir 1997',
    subtitle: 'Tragic lessons that shaped modern spacecraft engineering',
    analogyTitle: 'The Pure Oxygen Blowtorch',
    analogyContent: 'Air on Earth is only 21% oxygen. The rest is peaceful nitrogen gas. If you put someone in 100% pure oxygen, things that normally don’t catch fire—like Velcro strips, heavy cables, and astronaut suits—burst into roaring infernos in a fraction of a second!',
    technicalDepth: 'Apollo 1 (1967) used 100% O₂ at 16.7 psi (115 kPa) on the pad. The partial pressure of oxygen was five times higher than sea level, resulting in catastrophic combustion speed and immediate crew incapacitation.',
    points: [
      {
        title: 'Apollo 1 (Jan 27, 1967)',
        detail: 'A spark in wiring ignited the 100% pure O₂ cabin. In under 15 seconds, the internal pressure ruptured the hull, killing Grissom, White, and Chaffee.',
        tag: 'Apollo 1',
      },
      {
        title: 'Mir Space Station Fire (Feb 23, 1997)',
        detail: 'A solid chemical oxygen generator (Vika candle) cracked open and spewed a 4-foot blowtorch flame inside module Kvant-1, blinding the crew with soot.',
        tag: 'Mir 1997',
      },
      {
        title: 'The Escape Lifeboat Was Blocked',
        detail: 'The Mir fire sat directly between the cosmonauts and one of the Soyuz evacuation capsules, testing the crew’s survival limits.',
        tag: 'Near Disaster',
      },
    ],
    visualHint: 'apollo_mir_history',
    takeaway: 'Modern spacecraft (like ISS and Crew Dragon) never use 100% pure oxygen at sea level pressure. They dilute it with nitrogen to keep crew safe.',
  },
  {
    id: 4,
    badge: 'Dangerous Gases',
    title: 'The Stealth Threats: Hydrogen & "Cool Flames"',
    subtitle: 'Invisible fires burning without smoke or heat signals',
    analogyTitle: 'The Invisible Ghost Flame',
    analogyContent: 'When wood burns on Earth, you see bright orange flames and thick black smoke. But when pure Hydrogen leaks from a rocket fuel tank, it burns completely clear and pale blue. Astronauts could literally walk into an invisible 2,000°C wall of heat without seeing it until their suit catches fire!',
    technicalDepth: 'Hydrogen has an ultra-wide flammability range (4% to 75% in air) and an extremely low quenching distance (0.6 mm). Furthermore, NASA Saffire experiments on Cygnus discovered quasi-steady "cool diffusion flames" sustained at low temperatures (400-600°C) with zero soot.',
    points: [
      {
        title: 'Hydrogen (H₂) Fuel Leaks',
        detail: 'Produced by water electrolysis life support and used in rocket engines. Burns with zero smoke and invisible UV flames.',
        tag: 'Stealth Fuel',
      },
      {
        title: 'NASA Saffire Cool Flames',
        detail: 'Flames that look completely dead on regular cameras can keep silently burning at lower temperatures via low-temperature hydrocarbon chemistry.',
        tag: 'NASA Discovery',
      },
      {
        title: 'Soot Agglomeration',
        detail: 'In zero-g, soot particles don’t fall to the ground. They clump into giant sticky snowflake-like carbon webs that clog air filters.',
        tag: 'Filter Danger',
      },
    ],
    visualHint: 'invisible_hydrogen',
    takeaway: 'Never trust your eyes in space: thermal infrared imaging sensors and optical spectrometer flame detectors are required to spot invisible hydrogen fires!',
  },
  {
    id: 5,
    badge: 'Extinguishment Science',
    title: 'Putting Out Fire in Space: Why Water Hoses Fail',
    subtitle: 'How Clean Agents (FK-5-1-12) & Carbon Dioxide save the station',
    analogyTitle: 'Throwing Ice Cubes into a Supercomputer',
    analogyContent: 'If you sprayed a hose of water inside the International Space Station, the water would break into floating, electrically conductive water blobs that get sucked into million-dollar avionics computers, shorting out life support! Instead, astronauts use special heavy gases that freeze and smother the fire without leaving a single drop of liquid.',
    technicalDepth: 'Clean agents such as FK-5-1-12 (Novec 1230) possess an immense heat capacity (Cp = 116.4 J/mol·K). Flooding at 5-10% volume cools the reaction zone below the critical radical regeneration temperature, while fine water mist uses sub-micron droplets to vaporize into steam without electrical pooling.',
    points: [
      {
        title: 'No Liquid Water Puddles',
        detail: 'Standard liquid fire hoses cause short-circuits, electrocution, and water ingress into sensitive guidance computers.',
        tag: 'Avionics Safety',
      },
      {
        title: 'FK-5-1-12 Clean Gas',
        detail: 'A non-toxic fluoroketone gas that absorbs heat so fast the flame’s chemical chain reaction immediately collapses.',
        tag: 'Clean Extinguisher',
      },
      {
        title: 'Carbon Dioxide Flooding',
        detail: 'Discharged from portable extinguishers. Must be used with caution because excess CO₂ will poison the cabin atmosphere if astronauts remove masks.',
        tag: 'CO2 Smothering',
      },
    ],
    visualHint: 'suppression_protocols',
    takeaway: 'Space fire extinguishers use heavy cooling gases or microscopic water mist droplets that vanish into steam instead of splashing on electronics.',
  },
  {
    id: 6,
    badge: 'Future Horizons',
    title: 'Artemis & Mars: The 34% Oxygen Conundrum',
    subtitle: 'Designing habitats for Moon bases and Red Planet outposts',
    analogyTitle: 'The Scuba Diver’s Bends vs Space Fire',
    analogyContent: 'When astronauts step into a spacesuit to walk on the Moon, they must lower the pressure so their suit can bend. On the ISS, astronauts have to sit in a room breathing pure oxygen for 4 hours just to purge nitrogen from their blood and avoid "the bends"! NASA’s solution for Artemis is to keep the whole cabin at low pressure with 34% oxygen—saving hours of time, but making fires far more eager to start!',
    technicalDepth: 'The NASA Exploration Atmosphere (56.5 kPa / 8.2 psi with 34% O₂) maintains a sea-level equivalent alveolar oxygen partial pressure (PaO₂). However, higher molar oxygen concentration increases burning velocities of flight fabrics by up to 25%.',
    points: [
      {
        title: 'Artemis Gateway & Moon Base',
        detail: 'Operates at 8.2 psi (56.5 kPa) and 34% O₂ to enable fast, routine lunar spacewalks without hours of pre-breathe.',
        tag: 'Artemis Protocol',
      },
      {
        title: 'Mars Sabatier Fuel Factories',
        detail: 'Mars habitats will synthesize hundreds of tons of Methane (CH₄) and Hydrogen (H₂) on-site, requiring strict automated zone isolation.',
        tag: 'Mars ISRU',
      },
      {
        title: 'Super Intelligence (SI) Guardians',
        detail: 'Future deep-space cruisers will use onboard AI to continuously sniff gas ratios, predict quench distances, and cut module vents before flames spread.',
        tag: 'SI Safety Future',
      },
    ],
    visualHint: 'artemis_mars',
    takeaway: 'As humanity voyages to the Moon and Mars, Super Intelligence monitors will be our first line of defense against the silent, spherical flames of space.',
  },
];
