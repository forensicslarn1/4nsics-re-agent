import r2pipe from 'r2pipe';
import { existsSync } from 'node:fs';
import type {
  BinaryFunction,
  BinaryString,
  BinarySection,
  XRefData,
  FunctionDisassembly,
  InstructionInfo,
} from './types.js';

export interface R2PipeInstance {
  cmd(command: string, cb?: (err: any, res: string) => void): void;
  cmdj(command: string, cb?: (err: any, res: any) => void): void;
  quit(cb?: (err?: any) => void): void;
}

export class BinaryAnalyzer {
  private r2: R2PipeInstance | null = null;
  private currentFilePath: string | null = null;

  private async executeCommand(command: string): Promise<string> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }
    return new Promise((resolve, reject) => {
      this.r2!.cmd(command, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  private async executeCommandJson<T = any>(command: string): Promise<T> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }
    return new Promise((resolve, reject) => {
      this.r2!.cmdj(command, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }

  public async initialize(filePath: string): Promise<{ info: any; filePath: string }> {
    if (!existsSync(filePath)) {
      throw new Error(`Binary file not found: ${filePath}`);
    }

    if (this.r2) {
      await this.close();
    }

    console.error(`[BinaryAnalyzer] Opening file: ${filePath}`);

    const r2Instance = await new Promise<R2PipeInstance>((resolve, reject) => {
      let settled = false;
      // Pass ['-2'] to suppress stderr and keep communication clean
      (r2pipe as any).open(filePath, ['-2'], (err: any, instance: any) => {
        if (settled) return;
        settled = true;
        if (err) {
          reject(new Error(`Failed to spawn radare2 for ${filePath}: ${err?.message || err}`));
        } else {
          resolve(instance);
        }
      });
    });

    this.r2 = r2Instance;
    this.currentFilePath = filePath;

    console.error('[BinaryAnalyzer] Analyzing binary structure and symbols...');
    const info = await this.executeCommandJson<any>('ij');
    await this.executeCommand('aa');
    await this.executeCommand('aar'); // Analyze cross references

    return {
      filePath,
      info: info?.core || info?.bin || info,
    };
  }

  public async getFunctions(limit?: number): Promise<BinaryFunction[]> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }

    console.error('[BinaryAnalyzer] Fetching functions via aflj...');
    const rawFunctions = await this.executeCommandJson<any[]>('aflj');

    if (!Array.isArray(rawFunctions)) {
      return [];
    }

    // Exclude external library functions sym.imp.*
    const filtered = rawFunctions
      .filter((fn) => fn && typeof fn.name === 'string' && !fn.name.startsWith('sym.imp.'))
      .map((fn) => ({
        offset: typeof fn.offset === 'number' ? fn.offset : (typeof fn.addr === 'number' ? fn.addr : 0),
        name: fn.name,
        size: typeof fn.size === 'number' ? fn.size : 0,
        nargs: typeof fn.nargs === 'number' ? fn.nargs : undefined,
        nbbs: typeof fn.nbbs === 'number' ? fn.nbbs : undefined,
        calltype: typeof fn.calltype === 'string' ? fn.calltype : undefined,
        signature: typeof fn.signature === 'string' ? fn.signature : undefined,
      }));

    if (typeof limit === 'number' && limit > 0) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  public async getStrings(minLen = 4, limit?: number): Promise<BinaryString[]> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }

    console.error(`[BinaryAnalyzer] Fetching strings via izj (minLen: ${minLen})...`);
    const rawStrings = await this.executeCommandJson<any[]>('izj');

    if (!Array.isArray(rawStrings)) {
      return [];
    }

    const filtered = rawStrings
      .filter((s) => s && typeof s.string === 'string' && s.string.length >= minLen)
      .map((s) => ({
        vaddr: typeof s.vaddr === 'number' ? s.vaddr : 0,
        paddr: typeof s.paddr === 'number' ? s.paddr : 0,
        length: typeof s.length === 'number' ? s.length : s.string.length,
        size: typeof s.size === 'number' ? s.size : s.string.length,
        type: s.type || 'ascii',
        string: s.string,
        section: s.section,
      }));

    if (typeof limit === 'number' && limit > 0) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  public async getSections(): Promise<BinarySection[]> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }

    console.error('[BinaryAnalyzer] Fetching sections via iSj...');
    const rawSections = await this.executeCommandJson<any[]>('iSj');

    if (!Array.isArray(rawSections)) {
      return [];
    }

    return rawSections.map((sec) => ({
      name: sec.name || '',
      size: typeof sec.size === 'number' ? sec.size : 0,
      vsize: typeof sec.vsize === 'number' ? sec.vsize : 0,
      vaddr: typeof sec.vaddr === 'number' ? sec.vaddr : 0,
      paddr: typeof sec.paddr === 'number' ? sec.paddr : 0,
      perm: sec.perm || '',
      flags: typeof sec.flags === 'number' ? sec.flags : undefined,
    }));
  }

  public async getXrefs(offsetOrName: string | number): Promise<XRefData[]> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }

    const target = typeof offsetOrName === 'number' ? `0x${offsetOrName.toString(16)}` : offsetOrName;
    console.error(`[BinaryAnalyzer] Fetching xrefs for ${target} via axtj & axfj...`);

    const results: XRefData[] = [];

    try {
      // 1. References TO this address / symbol (axtj)
      const toRefs = await this.executeCommandJson<any[]>(`axtj @ ${target}`);
      if (Array.isArray(toRefs)) {
        for (const item of toRefs) {
          if (!item) continue;
          results.push({
            from: typeof item.from === 'number' ? item.from : 0,
            to: target,
            type: item.type || 'CALL',
            opcode: item.opcode,
            fcn_name: item.fcn_name,
            fcn_addr: typeof item.fcn_addr === 'number' ? item.fcn_addr : undefined,
            direction: 'to',
          });
        }
      }
    } catch (e: any) {
      console.error(`[BinaryAnalyzer] Notice: axtj failed for ${target}:`, e?.message || e);
    }

    try {
      // 2. References FROM this address / symbol (axfj)
      const fromRefs = await this.executeCommandJson<any[]>(`axfj @ ${target}`);
      if (Array.isArray(fromRefs)) {
        for (const item of fromRefs) {
          if (!item) continue;
          results.push({
            from: typeof item.from === 'number' ? item.from : 0,
            to: typeof item.to === 'number' ? item.to : (item.to || item.addr || target),
            type: item.type || 'CALL',
            opcode: item.opcode,
            fcn_name: item.fcn_name,
            fcn_addr: typeof item.fcn_addr === 'number' ? item.fcn_addr : undefined,
            direction: 'from',
          });
        }
      }
    } catch (e: any) {
      console.error(`[BinaryAnalyzer] Notice: axfj failed for ${target}:`, e?.message || e);
    }

    return results;
  }

  public async disassembleFunction(offsetOrName: string | number): Promise<FunctionDisassembly> {
    if (!this.r2) {
      throw new Error('No active radare2 session. Please initialize with a binary file first.');
    }

    const target = typeof offsetOrName === 'number' ? `0x${offsetOrName.toString(16)}` : offsetOrName;
    console.error(`[BinaryAnalyzer] Disassembling function at ${target} via pdfj...`);

    let raw: any = null;
    try {
      raw = await this.executeCommandJson<any>(`pdfj @ ${target}`);
    } catch (e: any) {
      console.error(`[BinaryAnalyzer] pdfj query failed for ${target}:`, e?.message || e);
    }

    // Fallback: If pdfj did not return ops, try defining function first or using pdj
    if (!raw || !Array.isArray(raw.ops) || raw.ops.length === 0) {
      try {
        await this.executeCommand(`af @ ${target}`);
        raw = await this.executeCommandJson<any>(`pdfj @ ${target}`);
      } catch {}
    }

    // Secondary fallback: pdj 64 (disassemble 64 instructions at address)
    if (!raw || !Array.isArray(raw.ops) || raw.ops.length === 0) {
      try {
        const pdjOps = await this.executeCommandJson<any[]>(`pdj 64 @ ${target}`);
        if (Array.isArray(pdjOps) && pdjOps.length > 0) {
          raw = {
            name: String(target),
            addr: typeof pdjOps[0].addr === 'number' ? pdjOps[0].addr : (typeof pdjOps[0].offset === 'number' ? pdjOps[0].offset : 0),
            size: pdjOps.reduce((acc, curr) => acc + (curr.size || 0), 0),
            ops: pdjOps,
          };
        }
      } catch {}
    }

    const fnName = raw?.name || String(target);
    const fnOffset = typeof raw?.addr === 'number' ? raw.addr : (typeof raw?.offset === 'number' ? raw.offset : 0);
    const fnSize = typeof raw?.size === 'number' ? raw.size : 0;

    const instructions: InstructionInfo[] = (raw?.ops || []).map((op: any) => ({
      offset: typeof op.offset === 'number' ? op.offset : (typeof op.addr === 'number' ? op.addr : 0),
      opcode: op.opcode || op.disasm || '',
      bytes: op.bytes,
      size: typeof op.size === 'number' ? op.size : undefined,
      type: op.type,
      jump: typeof op.jump === 'number' ? op.jump : undefined,
      fail: typeof op.fail === 'number' ? op.fail : undefined,
      disasm: op.disasm || op.opcode || '',
    }));

    return {
      name: fnName,
      offset: fnOffset,
      size: fnSize,
      instructions,
    };
  }

  public async close(): Promise<void> {
    if (!this.r2) {
      return;
    }

    console.error('[BinaryAnalyzer] Closing radare2 session...');
    const currentR2 = this.r2;
    this.r2 = null;
    this.currentFilePath = null;

    await new Promise<void>((resolve) => {
      try {
        currentR2.cmd('q', () => {
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  public getActiveFilePath(): string | null {
    return this.currentFilePath;
  }
}
