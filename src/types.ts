export interface BinaryFunction {
  offset: number;
  name: string;
  size: number;
  nargs?: number;
  nbbs?: number;
  calltype?: string;
  signature?: string;
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

export interface BinarySection {
  name: string;
  size: number;
  vsize: number;
  vaddr: number;
  paddr: number;
  perm: string;
  flags?: number;
}

export interface FilterOptions {
  limit?: number;
  minLen?: number;
  query?: string;
  excludeImports?: boolean;
}
