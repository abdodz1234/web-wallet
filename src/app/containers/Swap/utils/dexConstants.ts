export const DEX_CID = '729fe098d9fd2b57705db1a05a74103dd4b891f535aef2ae69b47bcfdeef9cbf';
export const DEX_APP_URL = 'beam-dex-internal';
export const DEX_APP_NAME = 'BEAM DEX';

// All BEAM-native assets use 10^8 groths per token.
export const DEX_GROTHS = 100_000_000;

// BEAM tx fee added on top when paying with BEAM (aid=0).
export const DEX_TX_FEE = 0.011;

export const KIND_LABELS: Record<number, string> = {
  0: '0.05%',
  1: '0.3%',
  2: '1%',
};
