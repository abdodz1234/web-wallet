/**
 * Hook to fetch and calculate relayer fees
 */

import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { calculateRelayerFees, loadRatesCached } from './feeCalculation';

const ETH_ID = 'ethereum';
const BEAM_RATE_ID = 'beam';
const FETCH_INTERVAL = 5000; // 5 seconds

export interface UseRelayerFeeResult {
  relayerFees: Record<string, number>;
  relayerFeeByNetwork: number | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get relayer fees for different networks
 * @param networkId - Network ID (e.g., '42161' for Arbitrum)
 * @param networkName - Network name for fee lookup (e.g., 'arbitrum')
 */
export function useRelayerFee(
  networkId: string,
  networkName: string,
  currencyRateId: string = BEAM_RATE_ID,
  currencyDecimals: number = 8,
): UseRelayerFeeResult {
  const [relayerFees, setRelayerFees] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initializedRef = useRef(false);

  const fetchFees = useCallback(async () => {
    const isFirstFetch = !initializedRef.current;
    if (isFirstFetch) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const rates = await loadRatesCached();
      if (!rates) {
        throw new Error('Failed to load exchange rates');
      }

      const fees = await calculateRelayerFees(rates, currencyRateId, ETH_ID, currencyDecimals);
      setRelayerFees(fees);
      initializedRef.current = true;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('Failed to calculate relayer fees');
      setError(nextError);
      // eslint-disable-next-line no-console
      console.error('Error fetching relayer fees:', nextError);
    } finally {
      if (isFirstFetch) {
        setIsLoading(false);
      }
    }
  }, [currencyDecimals, currencyRateId]);

  useEffect(() => {
    // Initial fetch
    fetchFees();

    // Set up interval to refresh fees
    const interval = setInterval(() => {
      fetchFees();
    }, FETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchFees]);

  // Get relayer fee for the selected network
  const relayerFeeByNetwork = relayerFees[networkName];

  return {
    relayerFees,
    relayerFeeByNetwork,
    isLoading,
    error,
  };
}
