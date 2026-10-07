import {
  mockMetadata,
  mockSections,
  mockFunctions,
  mockDisassembly,
  mockStrings,
  mockXrefs,
} from '../data/mockData';
import type {
  BinaryMetadata,
  BinarySection,
  BinaryFunction,
  FunctionDisassembly,
  BinaryString,
  XRefData,
} from '../types';

export class BinaryAnalysisClient {
  async getMetadata(): Promise<BinaryMetadata> {
    return mockMetadata;
  }

  async getSections(): Promise<BinarySection[]> {
    return mockSections;
  }

  async getFunctions(limit?: number): Promise<BinaryFunction[]> {
    const list = mockFunctions;
    return limit ? list.slice(0, limit) : list;
  }

  async getDisassembly(functionName: string): Promise<FunctionDisassembly> {
    if (mockDisassembly[functionName]) {
      return mockDisassembly[functionName];
    }
    // Generic fallback for any requested function
    return {
      name: functionName,
      offset: 0x140001820,
      size: 128,
      instructions: [
        { offset: 0x140001820, opcode: 'push rbp', bytes: '55', size: 1, type: 'push', disasm: 'push rbp' },
        { offset: 0x140001821, opcode: 'mov rbp, rsp', bytes: '4889e5', size: 3, type: 'mov', disasm: 'mov rbp, rsp' },
        { offset: 0x140001824, opcode: 'sub rsp, 0x20', bytes: '4883ec20', size: 4, type: 'sub', disasm: 'sub rsp, 0x20' },
        { offset: 0x140001828, opcode: 'call 0x140003890', bytes: 'e863200000', size: 5, type: 'call', disasm: 'call SecurityCheckCookie' },
        { offset: 0x14000182d, opcode: 'xor eax, eax', bytes: '31c0', size: 2, type: 'xor', disasm: 'xor eax, eax' },
        { offset: 0x14000182f, opcode: 'add rsp, 0x20', bytes: '4883c420', size: 4, type: 'add', disasm: 'add rsp, 0x20' },
        { offset: 0x140001833, opcode: 'pop rbp', bytes: '5d', size: 1, type: 'pop', disasm: 'pop rbp' },
        { offset: 0x140001834, opcode: 'ret', bytes: 'c3', size: 1, type: 'ret', disasm: 'ret' },
      ],
    };
  }

  async getStrings(minLen = 4, limit?: number): Promise<BinaryString[]> {
    const filtered = mockStrings.filter((s) => s.length >= minLen);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async getXrefs(target: string): Promise<XRefData[]> {
    const filtered = mockXrefs.filter(
      (x) => x.to === target || x.fcn_name === target || String(x.from) === target
    );
    return filtered.length > 0 ? filtered : mockXrefs;
  }
}

export const analysisClient = new BinaryAnalysisClient();
