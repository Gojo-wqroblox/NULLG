import React from 'react';
import { FlameExperimentDatasetView } from './FlameExperimentDatasetView';
import { FlameMeasurement } from '../data/flameExperimentDataset';
import { FuelDefinition } from '../types';
import { X, Table, Database } from 'lucide-react';

interface FlameExperimentDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMeasurementToChamber?: (measurement: FlameMeasurement) => void;
  gases?: Record<string, number>;
  flameTempK?: number;
  gravityG?: number;
  pressureKpa?: number;
  fuel?: FuelDefinition;
  isIgnited?: boolean;
  onGasChange?: (gasId: string, val: number) => void;
}

export const FlameExperimentDatasetModal: React.FC<FlameExperimentDatasetModalProps> = ({
  isOpen,
  onClose,
  onApplyMeasurementToChamber,
  gases,
  flameTempK,
  gravityG,
  pressureKpa,
  fuel,
  isIgnited,
  onGasChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  NULLG Flame Experiment Dataset Console
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  CSV IMPORT / EXPORT & D3 KINETICS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Microgravity flame radius growth, extinction telemetry & real-time D3 O₂-temperature correlation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <FlameExperimentDatasetView
            onApplyMeasurementToChamber={(m) => {
              if (onApplyMeasurementToChamber) {
                onApplyMeasurementToChamber(m);
              }
              onClose();
            }}
            onCloseModal={onClose}
            gases={gases}
            flameTempK={flameTempK}
            gravityG={gravityG}
            pressureKpa={pressureKpa}
            fuel={fuel}
            isIgnited={isIgnited}
            onGasChange={onGasChange}
          />
        </div>
      </div>
    </div>
  );
};
