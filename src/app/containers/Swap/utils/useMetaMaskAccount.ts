import { useCallback, useEffect, useState } from 'react';
import {
  connectMetaMask,
  formatEthereumAddress,
  getMetaMaskAccount,
  onAccountsChanged,
  onChainChanged,
  EthereumWallet,
} from './ethereumWallet';

export type UseMetaMaskAccountResult = {
  wallet: EthereumWallet | null;
  address: string;
  connect: (networkId: number) => Promise<EthereumWallet | null>;
  refresh: () => Promise<EthereumWallet | null>;
  clear: () => void;
};

export function useMetaMaskAccount(): UseMetaMaskAccountResult {
  const [wallet, setWallet] = useState<EthereumWallet | null>(null);
  const [address, setAddress] = useState('');

  // connectMetaMask() calls resetMetaMaskProvider() which destroys the current
  // provider and all its listeners. We bump this counter after each connect() call
  // so that the accountsChanged / chainChanged listeners get re-registered on the
  // newly created provider instance.
  const [providerGeneration, setProviderGeneration] = useState(0);

  const clear = useCallback(() => {
    setWallet(null);
    setAddress('');
  }, []);

  const applyWallet = useCallback(
    (account: EthereumWallet | null | undefined) => {
      if (account) {
        setWallet(account);
        setAddress(formatEthereumAddress(account.address));
        return;
      }
      clear();
    },
    [clear],
  );

  const refresh = useCallback(async () => {
    try {
      const account = await getMetaMaskAccount();
      applyWallet(account ?? null);
      return account ?? null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to check MetaMask connection:', error);
      return null;
    }
  }, [applyWallet]);

  const connect = useCallback(
    async (networkId: number) => {
      const account = await connectMetaMask(networkId);
      applyWallet(account ?? null);
      // connectMetaMask() resets the underlying provider, so the accountsChanged /
      // chainChanged listeners registered in the effect below are now on the dead
      // provider. Incrementing providerGeneration causes the effect to re-run and
      // re-register those listeners on the freshly created provider.
      setProviderGeneration((g) => g + 1);
      return account ?? null;
    },
    [applyWallet],
  );

  useEffect(() => {
    refresh();

    const unsubscribeAccounts = onAccountsChanged((accounts) => {
      if (accounts.length > 0) {
        refresh();
      } else {
        clear();
      }
    });

    const unsubscribeChain = onChainChanged(() => {
      refresh();
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeChain();
    };
    // providerGeneration is intentionally included: when connectMetaMask() resets
    // the provider, bumping providerGeneration re-runs this effect so listeners are
    // re-registered on the new provider instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear, refresh, providerGeneration]);

  return {
    wallet,
    address,
    connect,
    refresh,
    clear,
  };
}
