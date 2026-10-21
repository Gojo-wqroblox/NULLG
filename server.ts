import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback scientific generator if API is unavailable or offline
function generateLocalFireAnalysis(data: any) {
  const { gases, pressureKpa, gravityG, ventilationSpeed, fuelType } = data;
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7; // Nitrous oxide contributes oxidizer power
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

  let dangerLevel = 'NOMINAL';
  let riskScore = 15;
  let flameBehavior = 'No sustainable combustion';
  let summarySimple = 'The atmosphere is inert or lacks sufficient oxygen to support combustion.';
  let scientificInterpretation = 'Oxygen concentration is below the Limiting Oxygen Index (LOI). Radical chain branching cannot overcome thermal conduction loss.';
  
  // Flammability evaluation
  if (novec > 5 || sf6 > 8 || co2 > 35) {
    dangerLevel = 'EXTINGUISHED';
    riskScore = 5;
    summarySimple = 'Fire is smothered! Heavy molecular gas (FK-5-1-12 / SF₆ / CO₂) absorbs heat and chokes out the flame.';
    flameBehavior = 'Immediate thermal quench and suppression. Zero visible reaction.';
    scientificInterpretation = 'High molar heat capacity of diluents depresses the adiabatic flame temperature below the extinction limit (~1400 K).';
  } else if (sih4 > 1.5 && o2 > 10) {
    dangerLevel = 'EXTREME';
    riskScore = 100;
    summarySimple = 'CRITICAL PYROPHORIC EVENT: Silane gas ignites spontaneously upon touching oxygen with zero spark needed!';
    flameBehavior = 'Self-igniting brilliant white incandescent fireball generating dense clouds of solid silica (glass) particles.';
    scientificInterpretation = 'Pyrophoric auto-ignition: negative activation barrier for SiH4 + O2 branching reactions. Spontaneous deflagration without external ignition source.';
  } else if (o2 < 11) {
    dangerLevel = 'EXTINGUISHED';
    riskScore = 10;
    summarySimple = 'Fire cannot breathe! Oxygen is under 11%, which is below what a flame needs to survive in space.';
    flameBehavior = 'Instant smolder extinction. Weak chemiluminescent flicker for milliseconds then dark.';
    scientificInterpretation = 'Sub-critical oxygen index. In zero-g without buoyant oxidizer replenishment, the reaction zone cools rapidly.';
  } else if (h2 > 4 && o2 > 14) {
    dangerLevel = 'EXTREME';
    riskScore = 96;
    summarySimple = 'CRITICAL DANGER: Invisible ghost bomb! Hydrogen leaks create a nearly invisible, scorching flame that can detonate with the tiniest spark.';
    flameBehavior = 'Invisible, pale ultra-violet blue spherical fireball. Extreme heat propagation without smoke.';
    scientificInterpretation = 'Wide flammability envelope (4-75% H2 in air) combined with extremely low Lewis number (Le < 1). Diffusive-thermal instabilities cause rapid flame front acceleration.';
  } else if (nh3 > 15 && o2 > 18) {
    dangerLevel = 'HIGH';
    riskScore = 84;
    summarySimple = 'TOXIC FIRE: Ammonia radiator leak burning with a yellow-green hue, generating deadly respiratory gases!';
    flameBehavior = 'Faint yellow-green spherical flame with heavy corrosive vapor halo.';
    scientificInterpretation = 'Narrow flammability limit (15-28% NH3 in air). Combustion yields nitrogen oxides (NOx) and toxic unburned ammonia fumes.';
  } else if ((c3h8 > 2 || c2h4 > 2.5) && o2 > 14) {
    dangerLevel = 'HIGH';
    riskScore = 86;
    summarySimple = 'Hydrocarbon fire (Propane/Ethylene) spewing thick soot flakes that float around in zero-g!';
    flameBehavior = 'Vibrant golden-orange flame with thick agglomerated soot clouds suspended in the air.';
    scientificInterpretation = 'Unsaturated/dense hydrocarbon pyrolysis yields intense carbon soot luminescence. In zero-g, soot fails to settle and clogs air filters.';
  } else if (o2 > 30) {
    dangerLevel = 'EXTREME';
    riskScore = o2 > 80 ? 99 : 88;
    summarySimple = 'FLASH FIRE RISK: High oxygen makes almost everything burn like gunpowder, similar to the tragic Apollo 1 conditions.';
    flameBehavior = 'Violent, brilliant white-hot flame with rapid surface flame spread velocity.';
    scientificInterpretation = 'Elevated partial pressure of oxygen drastically lowers activation energy barriers and accelerates solid-phase pyrolysis.';
  } else if (ch4 > 5 && o2 > 12) {
    dangerLevel = 'HIGH';
    riskScore = 82;
    summarySimple = 'Methane leak detected! High combustion hazard with radiant blue core and heavy soot formation.';
    flameBehavior = 'Bright azure blue spherical mantle with yellow incandescent soot cap.';
    scientificInterpretation = 'Hydrocarbon diffusion flame. In microgravity, absence of buoyancy allows soot particles to aggregate into larger fractal clusters.';
  } else if (o2 >= 18) {
    if (gravityG === 0) {
      if (ventilationSpeed < 0.05) {
        dangerLevel = 'ELEVATED';
        riskScore = 48;
        summarySimple = 'A quiet, glowing blue sphere forms! With zero fan air, the flame will slowly choke on its own smoke bubble.';
        flameBehavior = 'Symmetric, quiet glowing blue sphere (~2.5 cm diameter) with gentle radial diffusion.';
        scientificInterpretation = 'Pure diffusive transport. Combustion products (CO2, H2O) accumulate spherically around the reaction zone, creating self-extinguishing suffocation unless ventilated.';
      } else {
        dangerLevel = 'HIGH';
        riskScore = 70;
        summarySimple = 'Spacecraft fans are feeding the flame! The airflow turns the quiet sphere into an elongated blowtorch.';
        flameBehavior = 'Asymmetric teardrop flame trailing downwind from the forced ventilation fan vector.';
        scientificInterpretation = 'Forced convection (Reynolds number Re ~ 50-200) renews oxidizer delivery to the reaction sheet, sustaining vigorous smoldering and flame spread.';
      }
    } else {
      dangerLevel = 'ELEVATED';
      riskScore = 55;
      summarySimple = 'Earth-like buoyant flame: hot air rises and pulls in fresh oxygen, creating a flickering candle shape.';
      flameBehavior = 'Classic buoyant teardrop flame flickering at 10-15 Hz with a bright yellow soot plume.';
      scientificInterpretation = 'Buoyancy-induced natural convection dominates (Grashof number Gr >> 1), evacuating exhaust upward and accelerating air ingress.';
    }
  }

  const rankedHazards = [
    {
      title: dangerLevel === 'EXTREME' ? 'Flash Deflagration / Explosion' : 'Atmospheric Suffocation & Oxygen Depletion',
      severity: dangerLevel === 'EXTREME' ? 'CRITICAL' : 'HIGH',
      description: 'Rapid consumption of cabin breathable oxygen and potential thermal shock to life support hull.',
    },
    {
      title: 'Toxic Carbon Monoxide (CO) & Cyanide Offgassing',
      severity: 'HIGH',
      description: `Thermal decomposition of ${fuelType || 'wiring and cabin materials'} generates lethal CO and particulates without buoyant smoke chimneying.`,
    },
    {
      title: 'Sensor Blindness & Invisible Thermal Pockets',
      severity: gravityG === 0 ? 'HIGH' : 'MEDIUM',
      description: 'In zero-g, smoke alarms that rely on rising smoke plumes fail to trigger early. Astronauts may physically walk into hot gas bubbles.',
    },
    {
      title: 'Avionics & ECLSS Corrosion',
      severity: 'MEDIUM',
      description: 'Soot particulates in microgravity remain suspended indefinitely in cabin air instead of falling to the floor.',
    },
  ];

  const astronautProtocol = [
    'IMMEDIATE: Shut down module ventilation and circulation fans to stop oxygen delivery to the flame.',
    'EVACUATION: Don emergency oxygen mask (EBA) immediately to prevent inhalation of invisible CO.',
    'ISOLATION: Seal module pressure hatch to contain toxic thermal gases and preserve main station atmosphere.',
    'SUPPRESSION: Deploy portable FK-5-1-12 clean agent or Fine Water Mist extinguisher directly at the fuel base.',
  ];

  return {
    dangerLevel,
    riskScore,
    summarySimple,
    scientificInterpretation,
    flameBehavior,
    rankedHazards,
    astronautProtocol,
    historicalPrecedent: o2 > 30 
      ? 'Apollo 1 (1967): Pure 100% O2 cabin atmosphere at 16.7 psi caused instantaneous fatal flash fire from a single wire arc.'
      : (gravityG === 0 
          ? 'Mir Space Station (1997): Solid fuel oxygen generator (Vika candle) ignited a blowtorch flame in zero gravity, blocking escape paths.'
          : 'NASA Saffire & BASS experiments: Confirmed microgravity flames burn cooler, expand spherically, and rely entirely on ventilation to survive.'),
  };
}

// SI Analysis Endpoint
app.post('/api/si/analyze-fire-safety', async (req, res) => {
  try {
    const { gases, pressureKpa, gravityG, ventilationSpeed, fuelType, isBeginnerMode } = req.body;

    if (!ai) {
      return res.json(generateLocalFireAnalysis(req.body));
    }

    const prompt = `You are the onboard Spaceflight Fire Safety Super Intelligence (SI) evaluating spacecraft atmosphere conditions:
Parameters:
- Gas Composition (Volume %): ${JSON.stringify(gases)}
- Cabin Pressure: ${pressureKpa} kPa (${(pressureKpa * 0.145038).toFixed(1)} psi)
- Gravity: ${gravityG} g (${gravityG === 0 ? 'Zero-G Microgravity' : gravityG === 0.16 ? 'Lunar Surface' : gravityG === 0.38 ? 'Mars Surface' : 'Earth 1G'})
- Air Ventilation / Fan Speed: ${ventilationSpeed} m/s
- Fuel Source: ${fuelType}
- Target Audience Level: ${isBeginnerMode ? 'Layperson / Space Cadet (make explanations simple, fun, using relatable everyday analogies like campfires, blankets, soup)' : 'Aerospace Engineer & Mission Commander'}

Provide a structured fire safety risk assessment with:
1. dangerLevel: One of "EXTREME", "HIGH", "ELEVATED", "NOMINAL", "EXTINGUISHED"
2. riskScore: 0 to 100
3. summarySimple: A crystal-clear, plain-English summary (1-2 sentences) understandable to someone with ZERO astronomy knowledge.
4. scientificInterpretation: Detailed combustion physics (mention buoyant vs diffusive transport, Limiting Oxygen Index, quenching distance).
5. flameBehavior: Physical appearance and shape (spherical vs teardrop, color, soot shells, radical emission).
6. rankedHazards: Array of objects with { title, severity ("CRITICAL"|"HIGH"|"MEDIUM"|"LOW"), description } ranked in priority order.
7. astronautProtocol: Array of 4 prioritized emergency action steps for astronauts.
8. historicalPrecedent: A relevant real-world spaceflight historical context (e.g., Apollo 1, Mir 1997 fire, NASA Saffire Cygnus experiments, BASS, FLEX).`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 12000)
    );

    const apiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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
                  description: { type: Type.STRING },
                },
                required: ['title', 'severity', 'description'],
              },
            },
            astronautProtocol: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            historicalPrecedent: { type: Type.STRING },
          },
          required: [
            'dangerLevel',
            'riskScore',
            'summarySimple',
            'scientificInterpretation',
            'flameBehavior',
            'rankedHazards',
            'astronautProtocol',
            'historicalPrecedent',
          ],
        },
      },
    });

    const response: any = await Promise.race([apiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.log('Using local combustion engine (Gemini quota or offline).');
    return res.json(generateLocalFireAnalysis(req.body));
  }
});

import { generateCaptainResponse } from './src/services/captainIntelligence.ts';

// Interactive Ask-Commander SI Endpoint
app.post('/api/si/ask-commander', async (req, res) => {
  try {
    const { question, chamberState, isBeginnerMode } = req.body;
    const hasValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10;

    if (ai && hasValidKey) {
      const systemPrompt = `You are Captain, the world's most advanced aerospace fire safety Super Intelligence stationed aboard a deep space exploration cruiser.
Your name is Captain. Your mission is to explain complex microgravity combustion, spacecraft fire safety, and atmospheric gas chemistry to human astronauts and space cadets.
Style guidelines:
- If isBeginnerMode is true: Explain using simple everyday analogies (campfires, blowing out candles, blankets, soup, vacuum cleaners). Avoid confusing jargon without immediate explanation. Be engaging, clear, and inspiring.
- If isBeginnerMode is false: Provide rigorous aerospace combustion thermodynamics (buoyancy Grashof number, Lewis numbers, LOI, Saffire findings, NASA-STD-6001).
- Keep answers concise, highly informative, and actionable (under 200 words).
- Introduce yourself or sign off as Captain.`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ask Commander timeout')), 10000)
      );

      const apiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Current Chamber State: ${JSON.stringify(chamberState)}
User Question: "${question}"`,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);
      if (response && response.text) {
        return res.json({ answer: response.text });
      }
    }

    const captainAnswer = generateCaptainResponse(question, chamberState, isBeginnerMode);
    return res.json({ answer: captainAnswer });
  } catch (error: any) {
    console.log('Using Captain local response (Gemini quota or offline).');
    const captainAnswer = generateCaptainResponse(req.body.question, req.body.chamberState, req.body.isBeginnerMode);
    return res.json({ answer: captainAnswer });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false, // HMR is disabled in AI Studio to prevent WebSocket connection errors
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 NULL-G Fire Safety SI Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
