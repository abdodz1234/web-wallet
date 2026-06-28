import { useState, useEffect, useRef } from 'react';
import { predictDexTrade, DexPool, DexPredict } from './dexApi';

export function useDexPrediction(
  fromAid: number | null,
  toAid: number | null,
  pools: DexPool[],
  fromGroths: number,
  manualKind: number | null,
) {
  const [predicted, setPredicted] = useState<DexPredict | null>(null);
  const [bestPool, setBestPool] = useState<DexPool | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fromAid === null || toAid === null || pools.length === 0 || fromGroths <= 0) {
      setPredicted(null);
      setBestPool(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setPredicted(null);
    setBestPool(null);

    let cancelled = false;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const poolsToTry = manualKind !== null ? pools.filter((p) => p.kind === manualKind) : pools;

      if (poolsToTry.length === 0 || cancelled) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const results = await Promise.allSettled(
        poolsToTry.map((pool) => predictDexTrade({
          aid1: toAid,
          aid2: fromAid,
          kind: pool.kind,
          val1_buy: 0,
          val2_pay: fromGroths,
        }).then((result) => ({ pool, result }))),
      );

      if (cancelled) return;

      const best = results.reduce<{ buy: number; pool: DexPool | null; prediction: DexPredict | null }>(
        (acc, r) => {
          if (r.status !== 'fulfilled') return acc;
          const buy = r.value.result?.buy ?? 0;
          return buy > acc.buy ? { buy, pool: r.value.pool, prediction: r.value.result } : acc;
        },
        { buy: -1, pool: null, prediction: null },
      );

      if (best.buy > 0 && best.pool && best.prediction) {
        setPredicted(best.prediction);
        setBestPool(best.pool);
      } else {
        setPredicted(null);
        setBestPool(null);
      }

      setIsLoading(false);
    }, 350);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fromAid, toAid, pools, fromGroths, manualKind]);

  return { predicted, isLoading, bestPool };
}
