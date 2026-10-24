/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Accessible Keyboard Shortcuts Modal & HUD for NULLG Zero-G Flame Simulator.
 * Provides accessible controls for primary simulation toggles:
 * - Space: Toggle Flame Ignition
 * - R: Reset to 0-G Settings
 * - A: Toggle Audio Mode (Ambient Ventilation Hum)
 * - 1-5: Direct Tab Navigation
 * - ?: Toggle Shortcuts Guide
 */

import React from 'react';
import {
  Keyboard,
  X,
  Power,
  RotateCcw,
  Volume2,
  Flame,
  Table,
  Activity,
  ShieldAlert,
  Siren,
  Sparkles,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerShortcut?: (shortcutKey: string) => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onTriggerShortcut,
}) => {
  if (!isOpen) return null;

  const shortcutsList = [
    {
      key: 'Space',
      label: 'Toggle Flame Ignition',
      description: 'Strike electric spark igniter or extinguish the active reaction front',
      icon: <Power className="w-4 h-4 text-emerald-400" />,
      actionId: 'space',
    },
    {
      key: 'R',
      label: 'Reset Environment to 0-G',
      description: 'Restore 0.0G microgravity, standard ISS air (21% O₂, 0.4% CO₂), and 0.15 m/s ventilation',
      icon: <RotateCcw className="w-4 h-4 text-cyan-400" />,
      actionId: 'r',
    },
    {
      key: 'A',
      label: 'Toggle Audio Mode',
      description: 'Enable or mute live Web Audio ambient ventilation hum (spools with airflow speed)',
      icon: <Volume2 className="w-4 h-4 text-indigo-400" />,
      actionId: 'a',
    },
    {
      key: '1',
      label: 'Flame Simulation View',
      description: 'Switch to 3D Three.js PBR chamber & environmental atmospheric mixers',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      actionId: '1',
    },
    {
      key: '2',
      label: 'NASA Experiments View',
      description: 'Inspect PSI-159 flight tables, ACME diagnostics & empirical radius runs',
      icon: <Table className="w-4 h-4 text-cyan-400" />,
      actionId: '2',
    },
    {
      key: '3',
      label: 'D3 Scatter Plot View',
      description: 'Live interactive oxygen concentration vs flame temperature correlation',
      icon: <Activity className="w-4 h-4 text-blue-400" />,
      actionId: '3',
    },
    {
      key: '4',
      label: 'AI Risk Assessment View',
      description: 'Spacecraft flammability envelope & toxic byproduct diagnostics',
      icon: <ShieldAlert className="w-4 h-4 text-yellow-400" />,
      actionId: '4',
    },
    {
      key: '5',
      label: 'Emergency Drill View',
      description: 'Interactive randomized spacecraft fire safety scenarios',
      icon: <Siren className="w-4 h-4 text-rose-400" />,
      actionId: '5',
    },
    {
      key: '?',
      label: 'Toggle Shortcuts Help',
      description: 'Open or dismiss this keyboard shortcuts accessibility guide',
      icon: <Keyboard className="w-4 h-4 text-slate-400" />,
      actionId: '?',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="shortcuts-dialog-title" className="text-sm font-bold text-white uppercase tracking-wider">
                  Global Keyboard Shortcuts
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  ACCESSIBILITY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Primary simulation controls and keyboard navigation shortcuts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {/* Primary Trio Highlights */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/60 border border-cyan-500/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Primary Quick Actions</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Press keys directly anywhere in the application without needing focus. Keys are automatically ignored when typing in text inputs or search bars.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {shortcutsList.map((sc) => (
              <div
                key={sc.key}
                onClick={() => onTriggerShortcut?.(sc.actionId)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                title={`Click or press [${sc.key}]`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700">
                    {sc.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {sc.label}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {sc.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <kbd className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-xs shadow-inner min-w-[2rem] text-center font-mono">
                    {sc.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span className="text-[11px]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Esc</kbd> to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
