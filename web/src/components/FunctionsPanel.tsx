import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  Code2,
  Box,
  Binary,
} from 'lucide-react';
import type { BinaryFunction } from '../types';

interface FunctionsPanelProps {
  functions: BinaryFunction[];
  selectedFunction: string;
  onSelectFunction: (name: string) => void;
}

export const FunctionsPanel: React.FC<FunctionsPanelProps> = ({
  functions,
  selectedFunction,
  onSelectFunction,
}) => {
  const [search, setSearch] = useState('');
  const [excludeImports, setExcludeImports] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'offset'>('offset');

  const filteredFunctions = useMemo(() => {
    return functions
      .filter((f) => {
        if (excludeImports && f.name.startsWith('sym.imp.')) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.offset.toString(16).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return a.offset - b.offset;
      });
  }, [functions, search, excludeImports, sortBy]);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-r border-slate-800">
      {/* Search & Filter Header */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search function by name or 0xAddress..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeImports}
              onChange={(e) => setExcludeImports(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-0 w-3 h-3"
            />
            <span>Exclude Imports (`sym.imp.*`)</span>
          </label>

          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-mono focus:outline-none"
            >
              <option value="offset">Sort: Address</option>
              <option value="size">Sort: Size</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Function Count Subheader */}
      <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>MATCHING FUNCTIONS: {filteredFunctions.length}</span>
        <span className="text-slate-500">CLICK TO DISASSEMBLE</span>
      </div>

      {/* Function List Table */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {filteredFunctions.map((fn) => {
          const isSelected = selectedFunction === fn.name;
          return (
            <button
              key={fn.offset}
              onClick={() => onSelectFunction(fn.name)}
              className={`w-full text-left p-3 transition-colors flex items-center justify-between group ${
                isSelected
                  ? 'bg-purple-950/40 border-l-2 border-purple-500 text-purple-100'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Code2
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isSelected ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold truncate flex items-center gap-1.5">
                    <span className={isSelected ? 'text-purple-200' : 'text-slate-200'}>
                      {fn.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                    <span className="text-cyan-400/80">0x{fn.offset.toString(16)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Binary className="w-2.5 h-2.5" />
                      {fn.size} B
                    </span>
                    {fn.nbbs && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Box className="w-2.5 h-2.5" />
                          {fn.nbbs} BBs
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isSelected
                    ? 'text-purple-400 translate-x-0.5'
                    : 'text-slate-600 group-hover:text-slate-400'
                }`}
              />
            </button>
          );
        })}

        {filteredFunctions.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No functions matching current filter
          </div>
        )}
      </div>
    </div>
  );
};
