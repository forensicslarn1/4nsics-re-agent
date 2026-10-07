import { useState } from 'react';
import {
  Copy,
  Check,
  Cpu,
  ArrowRight,
  FileCode2,
} from 'lucide-react';
import type { FunctionDisassembly, InstructionInfo } from '../types';

interface DisassemblyViewerProps {
  disassembly: FunctionDisassembly | null;
  onSelectAddress?: (addr: number) => void;
}

export const DisassemblyViewer: React.FC<DisassemblyViewerProps> = ({
  disassembly,
  onSelectAddress,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'asm' | 'json'>('asm');

  const handleCopy = () => {
    if (!disassembly) return;
    const text = disassembly.instructions
      .map((i) => `0x${i.offset.toString(16)}:  ${(i.bytes || '').padEnd(14)}  ${i.opcode}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightMnemonic = (opcode: string) => {
    const parts = opcode.split(' ');
    const mnemonic = parts[0];
    const operands = parts.slice(1).join(' ');

    let mnemonicColor = 'text-sky-300';
    if (['call'].includes(mnemonic)) mnemonicColor = 'text-emerald-400 font-bold';
    else if (['jmp', 'je', 'jne', 'jz', 'jnz', 'ja', 'jb', 'jle', 'jge'].includes(mnemonic))
      mnemonicColor = 'text-amber-400 font-bold';
    else if (['ret'].includes(mnemonic)) mnemonicColor = 'text-rose-400 font-bold';
    else if (['test', 'cmp'].includes(mnemonic)) mnemonicColor = 'text-purple-300';
    else if (['sub', 'add', 'xor', 'and', 'or'].includes(mnemonic)) mnemonicColor = 'text-indigo-300';
    else if (['nop'].includes(mnemonic)) mnemonicColor = 'text-slate-600';

    return (
      <span className="font-mono">
        <span className={`${mnemonicColor} inline-block w-16`}>{mnemonic}</span>
        <span className="text-slate-200">{operands}</span>
      </span>
    );
  };

  if (!disassembly) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
        <FileCode2 className="w-8 h-8 text-slate-600 mb-2" />
        <span>Select a function from the left panel to inspect disassembly</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Bar for Selected Function */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-purple-300">
                {disassembly.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                0x{disassembly.offset.toString(16)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {disassembly.size} bytes
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Total Instructions: {disassembly.instructions.length} ops
            </p>
          </div>
        </div>

        {/* View Controls & Copy Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-0.5 flex text-[10px] font-mono">
            <button
              onClick={() => setViewMode('asm')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'asm'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ASM Disasm
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'json'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON
            </button>
          </div>

          <button
            onClick={handleCopy}
            title="Copy disassembly to clipboard"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Disassembly View Content */}
      <div className="flex-1 overflow-y-auto font-mono text-xs p-4 select-text">
        {viewMode === 'asm' ? (
          <div className="space-y-1">
            <div className="grid grid-cols-12 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-800/80 pb-2 mb-2">
              <span className="col-span-3">Virtual Address</span>
              <span className="col-span-3">Machine Bytes</span>
              <span className="col-span-6">Instruction (Disassembly)</span>
            </div>

            {disassembly.instructions.map((instr: InstructionInfo, idx: number) => {
              const isJumpOrCall = instr.type === 'call' || instr.type?.includes('jmp');
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 py-1 px-2 rounded hover:bg-slate-900/80 transition-colors items-center group font-mono"
                >
                  {/* Address */}
                  <span className="col-span-3 text-cyan-400/90 text-[11px]">
                    0x{instr.offset.toString(16).padStart(8, '0')}
                  </span>

                  {/* Byte opcodes */}
                  <span className="col-span-3 text-slate-500 text-[11px] tracking-wider truncate pr-2">
                    {instr.bytes || '-'}
                  </span>

                  {/* Highlighted Assembly */}
                  <div className="col-span-6 flex items-center justify-between text-xs">
                    <div>{highlightMnemonic(instr.opcode)}</div>

                    {isJumpOrCall && instr.jump && (
                      <button
                        onClick={() => onSelectAddress && onSelectAddress(instr.jump!)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 hover:bg-amber-400/20"
                      >
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span>0x{instr.jump.toString(16)}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <pre className="text-slate-300 text-[11px] p-2 leading-relaxed">
            {JSON.stringify(disassembly, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
