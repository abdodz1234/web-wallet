import {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import { useSelector } from 'react-redux';
import { selectAssets, selectAssetsInfo } from '@app/containers/Wallet/store/selectors';
import { loadDexPools, DexPool } from './dexApi';

export interface DexAsset {
  aid: number;
  name: string;
  nthun: string;
  available: number;
}

export interface UseDexPoolsResult {
  pools: DexPool[];
  assets: DexAsset[];
  isLoading: boolean;
  error: string | null;
  getTargetAssets: (fromAid: number) => DexAsset[];
  getPoolsForPair: (aidA: number, aidB: number) => DexPool[];
  reload: () => void;
}

export function useDexPools(enabled: boolean): UseDexPoolsResult {
  const walletTotals = useSelector(selectAssets());
  const assetsInfo = useSelector(selectAssetsInfo());
  const [pools, setPools] = useState<DexPool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    loadDexPools()
      .then((p) => {
        if (!cancelled) setPools(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load pools');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const assets = useMemo<DexAsset[]>(() => {
    const aidSet = new Set<number>();
    pools.forEach((p) => {
      aidSet.add(p.aid1);
      aidSet.add(p.aid2);
    });
    const result: DexAsset[] = [];
    aidSet.forEach((aid) => {
      const total = walletTotals.find((t) => t.asset_id === aid);
      const info = assetsInfo.find((a) => a.asset_id === aid);

      let name: string;
      let nthun: string;
      if (aid === 0) {
        name = 'BEAM';
        nthun = 'Groth';
      } else {
        const mp = info?.metadata_pairs;
        name = mp?.SN || mp?.UN || mp?.N || `Asset ${aid}`;
        nthun = mp?.NTHUN || 'Groth';
      }

      result.push({
        aid,
        name,
        nthun,
        available: total?.available ?? 0,
      });
    });

    return result.sort((a, b) => a.aid - b.aid);
  }, [pools, walletTotals, assetsInfo]);

  const getTargetAssets = useCallback(
    (fromAid: number): DexAsset[] => {
      const targets = new Set<number>();
      pools.forEach((p) => {
        if (p.aid1 === fromAid) targets.add(p.aid2);
        if (p.aid2 === fromAid) targets.add(p.aid1);
      });
      return assets.filter((a) => targets.has(a.aid));
    },
    [pools, assets],
  );

  const getPoolsForPair = useCallback(
    (aidA: number, aidB: number): DexPool[] => pools.filter((p) => (p.aid1 === aidA && p.aid2 === aidB) || (p.aid1 === aidB && p.aid2 === aidA)),
    [pools],
  );

  return {
    pools,
    assets,
    isLoading,
    error,
    getTargetAssets,
    getPoolsForPair,
    reload,
  };
}
