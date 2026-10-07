import React from 'react';
import {
  ShieldCheck,
  HardDrive,
  Activity,
  Layers,
  Crosshair,
} from 'lucide-react';
import type { BinaryMetadata, BinarySection } from '../types';

interface MetricsBarProps {
  metadata: BinaryMetadata;
  sections: BinarySection[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metadata, sections }) => {
  const totalSectionSize = sections.reduce((acc, s) => acc + s.size, 0);

  const getSectionColor = (name: string, perm: string) => {
    if (perm.includes('x')) return 'bg-blue-500 hover:bg-blue-400';
    if (name.includes('data')) return 'bg-purple-500 hover:bg-purple-400';
    if (name.includes('rsrc')) return 'bg-amber-500 hover:bg-amber-400';
    return 'bg-emerald-500 hover:bg-emerald-400';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 p-4 select-none">
      <div className="flex flex-col gap-4">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-100">
                  {metadata.fileName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {metadata.format.toUpperCase()}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ANALYZED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-md" title={metadata.filePath}>
                {metadata.filePath}
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {/* Entropy */}
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase">Entropy</span>
                <span className="font-bold text-slate-200">
                  {metadata.entropy}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">/ 8.0</span>
                </span>
              </div>
            </div>

            {/* Entry Point */}
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase">Entry Point</span>
                <span className="font-bold text-cyan-300">
                  0x{metadata.entryPoint.toString(16)}
                </span>
              </div>
            </div>

            {/* Total Size */}
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase">Size</span>
                <span className="font-bold text-purple-300">{metadata.humanSize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Memory Map & Section Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>Section Memory Layout</span>
              <span className="text-[10px] text-slate-500">
                ({sections.length} mapped sections)
              </span>
            </span>
            <span className="text-[10px] text-slate-400">
              Total Mapped: {(totalSectionSize / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/80 p-[1px]">
            {sections.map((sec, idx) => {
              const pct = Math.max(3, (sec.size / totalSectionSize) * 100);
              return (
                <div
                  key={idx}
                  style={{ width: `${pct}%` }}
                  title={`${sec.name} (${(sec.size / 1024).toFixed(1)} KB) - Perm: ${sec.perm}`}
                  className={`h-full transition-all cursor-pointer ${getSectionColor(
                    sec.name,
                    sec.perm
                  )} ${idx !== sections.length - 1 ? 'border-r border-slate-950/40' : ''}`}
                />
              );
            })}
          </div>

          {/* Section Legends */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-mono">
            {sections.map((sec, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                <div
                  className={`w-2 h-2 rounded-full ${getSectionColor(sec.name, sec.perm).split(' ')[0]}`}
                />
                <span className="font-medium text-slate-300">{sec.name}</span>
                <span className="text-slate-500">({sec.perm})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
