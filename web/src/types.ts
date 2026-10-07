export interface BinaryMetadata {
  fileName: string;
  filePath: string;
  format: string;
  arch: string;
  bits: number;
  endian: string;
  size: number;
  humanSize: string;
  entropy: number;
  entryPoint: number;
  compiler?: string;
}

export interface BinarySection {
  name: string;
  size: number;
  vsize: number;
  vaddr: number;
  paddr: number;
  perm: string;
  entropy: number;
  flags?: number;
}

export interface BinaryFunction {
  offset: number;
  name: string;
  size: number;
  nargs?: number;
  nbbs?: number;
  calltype?: string;
  signature?: string;
  isImport?: boolean;
}

export interface InstructionInfo {
  offset: number;
  opcode: string;
  bytes?: string;
  size?: number;
  type?: string;
  jump?: number;
  fail?: number;
  disasm?: string;
}

export interface FunctionDisassembly {
  name: string;
  offset: number;
  size: number;
  instructions: InstructionInfo[];
}

export interface BinaryString {
  vaddr: number;
  paddr: number;
  length: number;
  size: number;
  type: string;
  string: string;
  section?: string;
}

export interface XRefData {
  from: number;
  to: number | string;
  type: string;
  opcode?: string;
  fcn_name?: string;
  fcn_addr?: number;
  direction?: 'to' | 'from';
}

export type ActiveTab = 'functions' | 'sections' | 'strings' | 'xrefs';
