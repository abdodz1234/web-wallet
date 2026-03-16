import { useCallback, useEffect, useState } from 'react';
import { formatBeamAddress, getWalletAddress } from './beamWalletApi';

export type UseBeamAddressResult = {
  address: string;
  refresh: () => Promise<void>;
};

export function useBeamAddress(networkId: string, onError?: (error: unknown) => void): UseBeamAddressResult {
  const [address, setAddress] = useState('');

  const refresh = useCallback(async () => {
    try {
      const nextAddress = await getWalletAddress(networkId);
      if (nextAddress) {
        setAddress(formatBeamAddress(nextAddress));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load Beam address from contract:', error);
      onError?.(error);
    }
  }, [networkId, onError]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    address,
    refresh,
  };
}
