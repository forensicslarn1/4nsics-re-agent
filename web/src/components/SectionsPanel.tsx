import { Layers } from 'lucide-react';
import type { BinarySection } from '../types';

interface SectionsPanelProps {
  sections: BinarySection[];
}

export const SectionsPanel: React.FC<SectionsPanelProps> = ({ sections }) => {
  const getPermBadge = (perm: string) => {
    let color = 'bg-slate-800 text-slate-400 border-slate-700';
    if (perm.includes('x')) color = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    else if (perm.includes('w')) color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    else if (perm.includes('r')) color = 'bg-purple-500/20 text-purple-300 border-purple-500/30';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${color}`}>
        {perm}
      </span>
    );
  };

  const getEntropyBar = (entropy: number) => {
    const pct = (entropy / 8.0) * 100;
    let color = 'bg-emerald-500';
    if (entropy > 7.0) color = 'bg-rose-500';
    else if (entropy > 6.0) color = 'bg-amber-500';

    return (
      <div className="flex items-center gap-2">
        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-mono text-slate-300">{entropy.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto font-sans">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Binary Sections & Structure (iSj)
          </h2>
          <p className="text-xs text-slate-400">
            Memory layout, permissions, and cryptographic entropy analysis across sections.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          {sections.length} Sections Defined
        </span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase text-slate-400">
            <tr>
              <th className="p-3.5">Section</th>
              <th className="p-3.5">Virtual Address</th>
              <th className="p-3.5">Virtual Size</th>
              <th className="p-3.5">Raw Size</th>
              <th className="p-3.5">Permissions</th>
              <th className="p-3.5">Entropy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sections.map((sec, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  {sec.name}
                </td>
                <td className="p-3.5 text-cyan-400">0x{sec.vaddr.toString(16)}</td>
                <td className="p-3.5">{(sec.vsize / 1024).toFixed(1)} KB</td>
                <td className="p-3.5">{(sec.size / 1024).toFixed(1)} KB</td>
                <td className="p-3.5">{getPermBadge(sec.perm)}</td>
                <td className="p-3.5">{getEntropyBar(sec.entropy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
