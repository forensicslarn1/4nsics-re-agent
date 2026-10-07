import React from 'react';
import {
  Layers,
  Code2,
  Type,
  GitFork,
  ShieldAlert,
  Binary,
  Radio,
  Cpu,
} from 'lucide-react';
import type { ActiveTab, BinaryMetadata } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  metadata: BinaryMetadata;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  metadata,
}) => {
  const navItems = [
    {
      id: 'functions' as ActiveTab,
      label: 'Functions',
      arabicLabel: 'قائمة الدوال',
      icon: Code2,
      count: '9',
    },
    {
      id: 'sections' as ActiveTab,
      label: 'Sections',
      arabicLabel: 'الهيكل والمقاطع',
      icon: Layers,
      count: '6',
    },
    {
      id: 'strings' as ActiveTab,
      label: 'Strings',
      arabicLabel: 'السلاسل النصية',
      icon: Type,
      count: '12+',
    },
    {
      id: 'xrefs' as ActiveTab,
      label: 'Cross Refs',
      arabicLabel: 'المراجع المتقاطعة',
      icon: GitFork,
      count: '10',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand & Title */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Binary className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
              4nsics-RE
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                AGENT
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">radare2 + MCP</p>
          </div>
        </div>
      </div>

      {/* Target Binary Info */}
      <div className="p-3 mx-3 mt-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Active Target
          </span>
          <span className="font-mono text-emerald-400 font-semibold uppercase text-[10px]">
            {metadata.format}
          </span>
        </div>
        <p className="font-mono text-xs font-medium text-slate-200 truncate" title={metadata.filePath}>
          {metadata.fileName}
        </p>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {metadata.arch}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {metadata.humanSize}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Inspection Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{item.arabicLabel}</div>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isActive
                    ? 'bg-purple-500/30 text-purple-200 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[10px]">MCP Stdio: OK</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
