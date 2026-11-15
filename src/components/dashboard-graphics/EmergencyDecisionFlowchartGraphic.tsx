/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EmergencyDecisionFlowchartGraphic.tsx
 * An interactive, animated decision tree flowchart visualizing NASA Flight Rule A13-1.
 * Features glowing signal pulses, branch highlights, and clickable protocol nodes.
 */

import React, { useState } from 'react';
import { AlertTriangle, Wind, Zap, Shield, CheckCircle2, Info, ArrowRight, ShieldAlert } from 'lucide-react';

export const EmergencyDecisionFlowchartGraphic: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<number>(1);

  const nodes = [
    {
      id: 1,
      step: 'STAGE 1',
      title: 'FIRE ALARM DETECTED',
      subtitle: 'Optical Smoke & Ionization Trigger',
      color: 'rose',
      details: 'Instant klaxon sounds. Astronauts must verify compartment telemetry and determine if fire is contained inside an avionics rack or open cabin.',
      flightRule: 'A13-1 Sec 1.1',
    },
    {
      id: 2,
      step: 'STAGE 2',
      title: 'CUT AIRFLOW & POWER',
      subtitle: 'Damper Shut & Electrical Bus Trip',
      color: 'amber',
      details: 'MANDATORY FIRST ACTION: Shut Inter-Module Ventilation (IMV) valves to isolate smoke. De-energize high-voltage power lines feeding the rack.',
      flightRule: 'A13-1 Sec 1.4',
    },
    {
      id: 3,
      step: 'STAGE 3',
      title: 'SUPPRESSION DISCHARGE',
      subtitle: 'CO₂ vs Water Mist vs Nitrogen',
      color: 'cyan',
      details: 'Match the suppressant to the fire class. Avionics Rack: CO₂ or Fine Nitrogen Flood. Open Cabin: Water Mist. NEVER deploy Halon in closed ISS volume.',
      flightRule: 'A13-1 Sec 2.2',
    },
    {
      id: 4,
      step: 'STAGE 4',
      title: 'PBA & TCCS SCRUBBING',
      subtitle: 'Don Masks & Filter Acidic Gases',
      color: 'indigo',
      details: 'Crew dons Personal Breathing Apparatus (PBA). Activate Trace Contaminant Control System (TCCS) scrubbers to capture lethal CO and HF.',
      flightRule: 'A13-1 Sec 3.1',
    },
    {
      id: 5,
      step: 'STAGE 5',
      title: 'ATMOSPHERE CLEARANCE',
      subtitle: 'Draeger Testing & Hatch Re-entry',
      color: 'emerald',
      details: 'Perform chemical tube test for Carbon Monoxide (<50 ppm) and Hydrogen Fluoride (<1 ppm) before declaring module safe for open entry.',
      flightRule: 'A13-1 Sec 4.0',
    },
  ];

  const active = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <div className="rounded-2xl bg-slate-950 border border-cyan-500/40 p-4 shadow-xl flex flex-col gap-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            NASA Flight Rule A13-1: Interactive Decision Tree
          </h4>
        </div>
        <span className="text-[10px] text-cyan-400">CLICK ANY NODE TO INSPECT PROCEDURE</span>
      </div>

      {/* Visual Flowchart Track */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
        {nodes.map((node, index) => {
          const isSelected = selectedNode === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node.id)}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                  {node.step}
                </span>
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-ping' : 'bg-slate-800'}`} />
              </div>

              <div className="my-2">
                <h5 className={`font-bold text-[11px] leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {node.title}
                </h5>
                <p className="text-[9px] text-slate-500 mt-1 font-sans leading-tight">
                  {node.subtitle}
                </p>
              </div>

              <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>{node.flightRule}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Detailed Briefing Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-cyan-500/30 flex items-start justify-between gap-3 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              {active.step}: {active.flightRule}
            </span>
            <h4 className="font-bold text-white font-mono text-sm">{active.title}</h4>
          </div>
          <p className="text-slate-300 font-sans text-xs leading-relaxed mt-0.5">
            {active.details}
          </p>
        </div>
      </div>
    </div>
  );
};
