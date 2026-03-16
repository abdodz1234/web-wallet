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
  }, [clear, refresh]);

  return {
    wallet,
    address,
    connect,
    refresh,
    clear,
  };
}
