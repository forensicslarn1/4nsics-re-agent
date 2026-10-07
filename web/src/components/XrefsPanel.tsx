import { useState, useMemo } from 'react';
import { GitFork, ArrowRight, Search } from 'lucide-react';
import type { XRefData } from '../types';

interface XrefsPanelProps {
  xrefs: XRefData[];
  onSelectAddress?: (addr: number) => void;
}

export const XrefsPanel: React.FC<XrefsPanelProps> = ({ xrefs, onSelectAddress }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredXrefs = useMemo(() => {
    return xrefs.filter((x) => {
      if (filterType !== 'ALL' && x.type !== filterType) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        String(x.to).toLowerCase().includes(q) ||
        (x.fcn_name && x.fcn_name.toLowerCase().includes(q)) ||
        (x.opcode && x.opcode.toLowerCase().includes(q)) ||
        x.from.toString(16).toLowerCase().includes(q)
      );
    });
  }, [xrefs, search, filterType]);

  const getTypeBadge = (type: string) => {
    let color = 'bg-slate-800 text-slate-300 border-slate-700';
    if (type === 'CALL') color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    else if (type === 'DATA') color = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    else if (type === 'CODE') color = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${color}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 flex flex-col h-full font-sans overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-emerald-400" />
            Cross References & Call Paths (axtj / axfj)
          </h2>
          <p className="text-xs text-slate-400">
            Call graph edges, cross-references to functions, and data references across memory.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search xrefs or callers..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono">
            {['ALL', 'CALL', 'DATA'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterType === t
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Xrefs Table Container */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-y-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase text-slate-400 sticky top-0">
            <tr>
              <th className="p-3">Source Address (From)</th>
              <th className="p-3">Caller Function</th>
              <th className="p-3">Reference Type</th>
              <th className="p-3">Calling Instruction</th>
              <th className="p-3">Target Reference (To)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredXrefs.map((x, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3">
                  <button
                    onClick={() => onSelectAddress && onSelectAddress(x.from)}
                    className="text-cyan-400 font-semibold hover:underline"
                    title="Inspect caller address"
                  >
                    0x{x.from.toString(16)}
                  </button>
                </td>
                <td className="p-3 text-purple-300 font-medium">{x.fcn_name || 'N/A'}</td>
                <td className="p-3">{getTypeBadge(x.type)}</td>
                <td className="p-3 text-slate-300 truncate max-w-xs">{x.opcode || '-'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span>{typeof x.to === 'number' ? `0x${x.to.toString(16)}` : x.to}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredXrefs.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No cross-references matching filter
          </div>
        )}
      </div>
    </div>
  );
};
