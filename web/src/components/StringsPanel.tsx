import { useState, useMemo } from 'react';
import { Type, Search, Copy, Check } from 'lucide-react';
import type { BinaryString } from '../types';

interface StringsPanelProps {
  strings: BinaryString[];
}

export const StringsPanel: React.FC<StringsPanelProps> = ({ strings }) => {
  const [search, setSearch] = useState('');
  const [minLen, setMinLen] = useState(4);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const filteredStrings = useMemo(() => {
    return strings.filter((s) => {
      if (s.length < minLen) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.string.toLowerCase().includes(q) ||
        (s.section && s.section.toLowerCase().includes(q))
      );
    });
  }, [strings, search, minLen]);

  const handleCopy = (str: string, idx: number) => {
    navigator.clipboard.writeText(str);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="flex-1 bg-slate-950 p-6 flex flex-col h-full font-sans overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Type className="w-5 h-5 text-purple-400" />
            Extracted Printable Strings (izj)
          </h2>
          <p className="text-xs text-slate-400">
            ASCII and UTF-16 wide strings extracted from binary sections and data segments.
          </p>
        </div>

        {/* Filter inputs */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in strings..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span>Min Len:</span>
            <input
              type="number"
              min={2}
              max={50}
              value={minLen}
              onChange={(e) => setMinLen(Number(e.target.value) || 2)}
              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Strings Table Container */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-y-auto shadow-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase text-slate-400 sticky top-0">
            <tr>
              <th className="p-3">Virtual Address</th>
              <th className="p-3">Length</th>
              <th className="p-3">Type</th>
              <th className="p-3">Section</th>
              <th className="p-3">String Value</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredStrings.map((s, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 text-cyan-400">0x{s.vaddr.toString(16)}</td>
                <td className="p-3">{s.length}</td>
                <td className="p-3 uppercase text-[10px] text-purple-300 font-bold">{s.type}</td>
                <td className="p-3 text-slate-400">{s.section || 'N/A'}</td>
                <td className="p-3 text-emerald-300 font-semibold truncate max-w-md">
                  "{s.string}"
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleCopy(s.string, idx)}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy string"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStrings.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No strings matching search query
          </div>
        )}
      </div>
    </div>
  );
};
