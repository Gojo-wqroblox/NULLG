import React, { useState, useMemo } from 'react';
import {
  NASA_RESOURCES_DATA,
  RESEARCHERS_GUIDE_CHAPTERS,
  NasaResourceCategory,
  NasaResourceEntry,
} from '../data/nasaResourcesData';
import {
  BookOpen,
  Flame,
  ShieldAlert,
  Database,
  Wind,
  ArrowRight,
  Siren,
  CheckCircle2,
  Layers,
  Gauge,
  Activity,
  Radio,
  Thermometer,
} from 'lucide-react';

interface NasaResourcesArchiveProps {
  onApplyExperimentConditions?: (conditions: {
    gravityG: number;
    o2Pct: number;
    co2Pct: number;
    ventilationSpeed: number;
    fuelName: string;
    pressureKpa?: number;
  }) => void;
  onSelectDatasetProgram?: (expId: string) => void;
  onLaunchEmergencyScenario?: (scenarioId: string) => void;
}

export const NasaResourcesArchive: React.FC<NasaResourcesArchiveProps> = ({
  onApplyExperimentConditions,
  onSelectDatasetProgram,
  onLaunchEmergencyScenario,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | NasaResourceCategory>('all');
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);

  // Interactive Lab 1: Space Shuttle Smoke vs Dust Discriminator (1970s Fire Detector Spinoff)
  const [particleDiameterUm, setParticleDiameterUm] = useState<number>(0.35);
  const [ionChamberRatio, setIonChamberRatio] = useState<number>(0.78);

  // Interactive Lab 2: Spinoff Materials & SCBA Gear Comparison
  const [gearMode, setGearMode] = useState<'scba_tanks' | 'pbi_attire'>('scba_tanks');

  const filteredResources = useMemo(() => {
    if (categoryFilter === 'all') return NASA_RESOURCES_DATA;
    return NASA_RESOURCES_DATA.filter((r) => r.category === categoryFilter);
  }, [categoryFilter]);

  const detectorAnalysis = useMemo(() => {
    const isSmokeRange = particleDiameterUm <= 1.2 && ionChamberRatio >= 0.45;
    const isDustRange = particleDiameterUm >= 2.0 || ionChamberRatio < 0.35;
    if (isSmokeRange) {
      return {
        classification: 'Combustion Smoke Aerosol Detected',
        alarmTriggered: true,
        statusClass: 'text-rose-400',
        borderClass: 'border-rose-500/50 bg-rose-950/20',
        explanation:
          'Sub-micron pyrolysis particulates strongly attenuate ionization current while scattering blue/IR light — verified real fire signature.',
      };
    }
    if (isDustRange) {
      return {
        classification: 'Nuisance Dust / Mining Grit Rejected',
        alarmTriggered: false,
        statusClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/50 bg-emerald-950/20',
        explanation:
          'Coarse mineral/lint particles (>2.0 µm) produce high forward optical scatter without ionization recombination drop — false alarm suppressed.',
      };
    }
    return {
      classification: 'Transitional Mixed Aerosol — Secondary Verification',
      alarmTriggered: false,
      statusClass: 'text-amber-400',
      borderClass: 'border-amber-500/50 bg-amber-950/20',
      explanation:
        'Aerosol sits in the 1.2–2.0 µm boundary band; Shuttle discriminator polls CO electrochemical trace before sounding crew klaxon.',
    };
  }, [particleDiameterUm, ionChamberRatio]);

  const activeChapter = RESEARCHERS_GUIDE_CHAPTERS[activeChapterIdx] || RESEARCHERS_GUIDE_CHAPTERS[0];

  const handleLoadResourcePreset = (resource: NasaResourceEntry) => {
    if (!resource.chamberPreset || !onApplyExperimentConditions) return;
    onApplyExperimentConditions({
      gravityG: resource.chamberPreset.gravityG,
      o2Pct: resource.chamberPreset.o2Pct,
      co2Pct: resource.chamberPreset.co2Pct,
      ventilationSpeed: resource.chamberPreset.ventilationSpeed,
      fuelName: resource.chamberPreset.fuelName,
      pressureKpa: resource.chamberPreset.pressureKpa,
    });
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      {/* Header & Filter Bar */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <div className="text-xs font-mono text-cyan-400 tracking-wider uppercase mb-1">
            NASA Open Science &amp; Spaceflight Safety Compendium
          </div>
          <h3 className="text-lg font-semibold text-white">
            Combustion Research, Historic Incidents &amp; Fire-Safety Spinoffs
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Grounded in the Physical Sciences Informatics (PSI) repository, ISS Combustion Science Guides, Apollo &amp; Mir failure investigations, and NASA firefighter technology transfers.
          </p>
        </div>

        {/* Interactive Category Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 self-start lg:self-center flex-wrap">
          {(
            [
              { id: 'all', label: 'All Sources (10)' },
              { id: 'psi_science', label: 'ISS & PSI Data (4)' },
              { id: 'historic_fires', label: 'Apollo & Mir (3)' },
              { id: 'earth_spinoffs', label: 'Earth Spinoffs (3)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                categoryFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Researcher's Guide Chapter Navigator (Shown when viewing All or ISS Science) */}
      {(categoryFilter === 'all' || categoryFilter === 'psi_science') && (
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                2015 Technical Monograph Explorer
              </div>
              <h4 className="text-sm font-semibold text-white mt-0.5">
                A Researcher’s Guide to International Space Station Combustion Science
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              5 Core ISS Investigations &amp; Facilities
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-5 flex flex-col gap-1.5">
              {RESEARCHERS_GUIDE_CHAPTERS.map((ch, idx) => {
                const isActive = idx === activeChapterIdx;
                return (
                  <button
                    key={ch.chapterNum}
                    onClick={() => setActiveChapterIdx(idx)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-cyan-400 font-semibold shrink-0 tabular-nums">
                        {ch.chapterNum}
                      </span>
                      <span className="font-medium truncate">{ch.title}</span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 p-4 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
                  <span>{activeChapter.chapterNum}</span>
                  <span>{activeChapter.facility}</span>
                </div>
                <h5 className="text-base font-semibold text-white">{activeChapter.title}</h5>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-cyan-300 font-mono">Empirical Finding: </strong>
                    {activeChapter.keyFinding}
                  </p>
                  <p>
                    <strong className="text-amber-300 font-mono">Spacecraft Fire Safety Impact: </strong>
                    {activeChapter.safetyImpact}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                <span className="text-slate-400">
                  Data archived in NASA PSI Repository
                </span>
                {onSelectDatasetProgram && (
                  <button
                    onClick={() =>
                      onSelectDatasetProgram(
                        activeChapterIdx === 0
                          ? 'psi159_normal'
                          : activeChapterIdx === 1
                          ? 'flex'
                          : activeChapterIdx === 2
                          ? 'acme_bre'
                          : activeChapterIdx === 3
                          ? 'sofie_gel'
                          : 'saffire'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Open Matching PSI Dataset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Spinoff Engineering Simulators (Shown when viewing All or Earth Spinoffs) */}
      {(categoryFilter === 'all' || categoryFilter === 'earth_spinoffs') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spinoff Interactive Lab 1: Space Shuttle Smoke vs. Dust Fire Detector */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  1970s Space Shuttle Spinoff Lab
                </div>
                <h4 className="text-sm font-semibold text-white mt-0.5">
                  Smoke vs. Dust Particle Discriminator
                </h4>
              </div>
              <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span>Aerosol Mean Particle Diameter</span>
                  <span className="text-cyan-300 font-bold tabular-nums">{particleDiameterUm.toFixed(2)} µm</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={6.0}
                  step={0.05}
                  value={particleDiameterUm}
                  onChange={(e) => setParticleDiameterUm(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>0.05 µm (Combustion Soot)</span>
                  <span>2.0+ µm (Mine / Lunar Dust)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span>Ionization Recombination Index</span>
                  <span className="text-amber-300 font-bold tabular-nums">{(ionChamberRatio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.02}
                  value={ionChamberRatio}
                  onChange={(e) => setIonChamberRatio(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setParticleDiameterUm(0.25);
                    setIonChamberRatio(0.84);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                >
                  Test Wire Smoke
                </button>
                <button
                  onClick={() => {
                    setParticleDiameterUm(3.8);
                    setIonChamberRatio(0.22);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                >
                  Test Coal Mine Dust
                </button>
              </div>
            </div>

            <div className={`p-3.5 rounded-lg border text-xs ${detectorAnalysis.borderClass}`}>
              <div className={`font-mono font-bold ${detectorAnalysis.statusClass}`}>
                {detectorAnalysis.alarmTriggered ? '▲ ALARM: ' : '● FILTERED: '}
                {detectorAnalysis.classification}
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">
                {detectorAnalysis.explanation}
              </p>
            </div>
          </div>

          {/* Spinoff Interactive Lab 2: Composite Air Tanks & PBI Fire Attire */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800 flex-wrap">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                  1970s–1980s Spacesuit Transfers
                </div>
                <h4 className="text-sm font-semibold text-white mt-0.5">
                  Firefighter SCBA &amp; PBI Attire Benchmark
                </h4>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => setGearMode('scba_tanks')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    gearMode === 'scba_tanks' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SCBA Tanks
                </button>
                <button
                  onClick={() => setGearMode('pbi_attire')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    gearMode === 'pbi_attire' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PBI Fire Attire
                </button>
              </div>
            </div>

            {gearMode === 'scba_tanks' ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Pre-1970s Steel SCBA</div>
                    <div className="text-xl font-bold text-slate-300 mt-1 tabular-nums">33.0 lb</div>
                    <div className="text-[11px] text-slate-400 mt-1 tabular-nums">2,216 psi · Heavy Back Strain</div>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
                    <div className="text-[10px] text-cyan-300 uppercase">NASA Composite SCBA</div>
                    <div className="text-xl font-bold text-cyan-300 mt-1 tabular-nums">19.8 lb</div>
                    <div className="text-[11px] text-emerald-400 mt-1 tabular-nums">4,500 psi · -40% Weight</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Filament-wound composite tanks derived from Apollo lunar life-support vessels cut firefighter breathing pack mass by roughly a third while doubling storage pressure and improving lumbar harness ergonomics.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Legacy Treated Cotton</div>
                    <div className="text-xl font-bold text-slate-300 mt-1 tabular-nums">~370 °C</div>
                    <div className="text-[11px] text-rose-400 mt-1">Chars &amp; Shrinks on Flashover</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40">
                    <div className="text-[10px] text-amber-300 uppercase">NASA PBI / Aluminized</div>
                    <div className="text-xl font-bold text-amber-300 mt-1 tabular-nums">700+ °C</div>
                    <div className="text-[11px] text-emerald-400 mt-1">Zero Melt · Zero Drip</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Apollo &amp; Shuttle spacesuit polymer research introduced Polybenzimidazole (PBI) fibers that refuse to melt or shrink under flashover heat flux, forming modern structural firefighter turnout gear and aircraft fire-blocking seat layers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((res) => {
          const categoryLabel =
            res.category === 'psi_science'
              ? 'ISS Combustion & PSI'
              : res.category === 'historic_fires'
              ? 'Historic Spaceflight Investigation'
              : 'NASA Earth Safety Spinoff';

          const accentColor =
            res.category === 'psi_science'
              ? 'text-cyan-400'
              : res.category === 'historic_fires'
              ? 'text-rose-400'
              : 'text-emerald-400';

          return (
            <div
              key={res.id}
              className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Clean Unboxed Metadata Header (Zero-Pill Discipline) */}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
                  <span className={`font-semibold ${accentColor}`}>{categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{res.eraOrYear}</span>
                  <span aria-hidden="true">·</span>
                  <span>{res.sourceProgram}</span>
                </div>

                <h4 className="text-base font-semibold text-white leading-snug">{res.title}</h4>

                <p className="text-xs text-slate-300 leading-relaxed">{res.summary}</p>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Verified Technical Facts
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {res.keyFacts.map((fact, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-cyan-400 font-mono mt-0.5">-</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                    Safety &amp; Engineering Lessons Learned
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {res.engineeringLessons.map((lesson, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Footer */}
              {(res.chamberPreset || res.linkedScenarioId || res.linkedExperimentId) && (
                <div className="pt-3 border-t border-slate-800 flex items-center flex-wrap gap-2">
                  {res.chamberPreset && onApplyExperimentConditions && (
                    <button
                      onClick={() => handleLoadResourcePreset(res)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{res.chamberPreset.label}</span>
                    </button>
                  )}

                  {res.linkedScenarioId && onLaunchEmergencyScenario && (
                    <button
                      onClick={() => onLaunchEmergencyScenario(res.linkedScenarioId!)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-200 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Siren className="w-3.5 h-3.5 text-rose-400" />
                      <span>Run Emergency Case Study</span>
                    </button>
                  )}

                  {res.linkedExperimentId && onSelectDatasetProgram && (
                    <button
                      onClick={() => onSelectDatasetProgram(res.linkedExperimentId!)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Load Empirical Dataset</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
