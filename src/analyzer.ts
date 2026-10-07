import r2pipe from 'r2pipe';
import { existsSync } from 'node:fs';
import type { BinaryFunction, BinaryString, BinarySection } from './types.js';

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

    console.error('[BinaryAnalyzer] Analyzing binary structure...');
    const info = await this.executeCommandJson<any>('ij');
    await this.executeCommand('aa');

    return {
      filePath,
      info: info?.core || info?.bin || info
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
        signature: typeof fn.signature === 'string' ? fn.signature : undefined
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
        section: s.section
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
      flags: typeof sec.flags === 'number' ? sec.flags : undefined
    }));
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
