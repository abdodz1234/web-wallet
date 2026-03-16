export const BEAM_ADDRESS_LENGTH = 66;

export const NETWORKS_BY_ID: Record<
number,
{
  name: string;
  indicator: string;
  relayerFeeNetworkId: string;
}
> = {
  1: {
    name: 'Ethereum',
    indicator: 'eth',
    relayerFeeNetworkId: 'ethereum',
  },
  42161: {
    name: 'Arbitrum',
    indicator: 'arb',
    relayerFeeNetworkId: 'arbitrum',
  },
};

export const NETWORKS_BY_INDICATOR: Record<string, number> = {
  eth: 1,
  arb: 42161,
  arbsep: 421614,
  sep: 11155111,
};

export type BeamBridgeAsset = {
  assetId: number;
  name: string;
  rateId: string;
  decimals: number;
  cidByNetwork: Record<string, string>;
  evmSymbol: string;
};

export const BEAM_BRIDGE_ASSETS: BeamBridgeAsset[] = [
  {
    assetId: 0,
    name: 'BEAM',
    rateId: 'beam',
    decimals: 8,
    evmSymbol: 'WBEAM',
    cidByNetwork: {
      1: 'e63bd26ca5b226558686dd191122a8e5d6861a97597db9f40bda48aef6dbe835',
      42161: 'd2505213880d87a4747d23036a02d8919be211d26266cd6f3e591536e44f27fe',
    },
  },
  {
    assetId: 1,
    name: 'bUSDT',
    rateId: 'tether',
    decimals: 8,
    evmSymbol: 'USDT',
    cidByNetwork: {
      1: '99c1e7d6168d71a0181ad2c8d75a1e37d671a75b4f2bd82907645f52baf7cecf',
    },
  },
  {
    assetId: 2,
    name: 'bETH',
    rateId: 'ethereum',
    decimals: 8,
    evmSymbol: 'ETH',
    cidByNetwork: {
      1: '2ce5d66babf25f1a1908df54b8d7ca6a14f7f9432e78ef94ac97293170924dec',
    },
  },
  {
    assetId: 3,
    name: 'bDAI',
    rateId: 'dai',
    decimals: 8,
    evmSymbol: 'DAI',
    cidByNetwork: {
      1: '3e90f6dce9518738fdd818e02477cc41d43093ee1ce5c16ecfd61ca24153c423',
    },
  },
  {
    assetId: 4,
    name: 'bWBTC',
    rateId: 'wrapped-bitcoin',
    decimals: 8,
    evmSymbol: 'WBTC',
    cidByNetwork: {
      1: 'a21d770ab51a61fe6913e567022e71745e7dbfd2fdc87e43123784065d218a98',
    },
  },
];

export type EvmBridgeAsset = {
  name: string;
  rateId: string;
  decimals: number;
  ethTokenContract: `0x${string}` | '';
  ethPipeContract: `0x${string}`;
  kind: 'erc20' | 'native';
  beamAssetName: string;
};

export const EVM_ASSETS_BY_CHAIN: Partial<Record<number, EvmBridgeAsset[]>> = {
  1: [
    {
      name: 'USDT',
      rateId: 'tether',
      decimals: 6,
      ethTokenContract: '0x7D5D7c75d60BcaCD948cf3aCdEa164986b1f0755',
      ethPipeContract: '0xE1843841d03C46BFBf7ae027640fD921dE5F8f53',
      kind: 'erc20',
      beamAssetName: 'bUSDT',
    },
    {
      name: 'WBTC',
      rateId: 'wrapped-bitcoin',
      decimals: 8,
      ethTokenContract: '0xFf42D250DC5111E58FD7e43e400097f3fDE65b18',
      ethPipeContract: '0x8a7F12320052f20A40fD6815509A17236b8C7A0E',
      kind: 'erc20',
      beamAssetName: 'bWBTC',
    },
    {
      name: 'DAI',
      rateId: 'dai',
      decimals: 18,
      ethTokenContract: '0xAC7CD333aC49A98C0C18A550ac03e4935B8d1CBE',
      ethPipeContract: '0xb8cA4dCe56f895eEEe65f88945cf379166844bc1',
      kind: 'erc20',
      beamAssetName: 'bDAI',
    },
    {
      name: 'ETH',
      rateId: 'ethereum',
      decimals: 18,
      ethTokenContract: '',
      ethPipeContract: '0xF0860856D305803bF2adbEF064CC38bE94A9d006',
      kind: 'native',
      beamAssetName: 'bETH',
    },
  ],
};

export const WBEAM_BY_CHAIN: Record<
number,
{
  name: 'WBEAM';
  symbol: 'WBEAM';
  decimals: number;
  rateId: 'beam';
  token: `0x${string}`;
  pipe: `0x${string}`;
}
> = {
  1: {
    name: 'WBEAM',
    symbol: 'WBEAM',
    decimals: 8,
    rateId: 'beam',
    token: '0xE5AcBB03D73267c03349c76EaD672Ee4d941F499',
    pipe: '0x6063024646E8A1561970840a4b0e0f1082f5a670',
  },
  42161: {
    name: 'WBEAM',
    symbol: 'WBEAM',
    decimals: 8,
    rateId: 'beam',
    token: '0xE5AcBB03D73267c03349c76EaD672Ee4d941F499',
    pipe: '0x6063024646E8A1561970840a4b0e0f1082f5a670',
  },
};

export function getEvmAssets(chainId?: number): EvmBridgeAsset[] {
  if (!chainId) {
    return [];
  }

  const baseAssets = EVM_ASSETS_BY_CHAIN[chainId] ?? [];
  const wbeam = WBEAM_BY_CHAIN[chainId];
  const wbeamAsset: EvmBridgeAsset | null = wbeam
    ? {
      name: wbeam.symbol,
      rateId: wbeam.rateId,
      decimals: wbeam.decimals,
      ethTokenContract: wbeam.token,
      ethPipeContract: wbeam.pipe,
      kind: 'erc20',
      beamAssetName: 'BEAM',
    }
    : null;

  if (!wbeamAsset) {
    return baseAssets;
  }

  const deduped = new Map<string, EvmBridgeAsset>();
  [...baseAssets, wbeamAsset].forEach((asset) => {
    if (!deduped.has(asset.name)) {
      deduped.set(asset.name, asset);
    }
  });

  return Array.from(deduped.values());
}
