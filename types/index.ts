export type Pattern = {
  name: string;
  line: number;
  code: string;
};

export type ScanResult = {
  isHoneypot: boolean;
  confidence: number;
  patterns: Pattern[];
  message: string;
  chain: string;
};
