import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { erc20Abi } from './evmContracts';
import { getEthersProvider, EthereumWallet } from './ethereumWallet';
import { EvmBridgeAsset } from '../constants';

const POLL_INTERVAL = 30000;

export type EvmBalance = {
  raw: ethers.BigNumber;
  formatted: string;
};

export type UseEvmBalancesResult = {
  balances: Record<string, EvmBalance>;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

type UseEvmBalancesParams = {
  wallet: EthereumWallet | null;
  selectedNetwork: string;
  assets: EvmBridgeAsset[];
};

export function useEvmBalances({ wallet, selectedNetwork, assets }: UseEvmBalancesParams): UseEvmBalancesResult {
  const [balances, setBalances] = useState<Record<string, EvmBalance>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!wallet || wallet.chainId !== Number(selectedNetwork)) {
      setBalances({});
      return;
    }

    const provider = getEthersProvider();
    if (!provider) {
      return;
    }

    setIsLoading(true);
    try {
      const balanceResults = await Promise.all(
        assets.map(async (asset) => {
          if (asset.kind === 'native') {
            const raw = await provider.getBalance(wallet.address);
            return { name: asset.name, raw, decimals: asset.decimals };
          }
          if (asset.ethTokenContract) {
            const tokenContract = new ethers.Contract(asset.ethTokenContract, erc20Abi, provider);
            const raw = await tokenContract.balanceOf(wallet.address);
            return { name: asset.name, raw, decimals: asset.decimals };
          }
          return null;
        }),
      );

      const nextBalances = balanceResults.reduce((acc, item) => {
        if (!item) {
          return acc;
        }
        acc[item.name] = {
          raw: item.raw,
          formatted: ethers.utils.formatUnits(item.raw, item.decimals),
        };
        return acc;
      }, {} as Record<string, EvmBalance>);

      setBalances(nextBalances);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load EVM balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [assets, selectedNetwork, wallet]);

  useEffect(() => {
    refresh();

    if (!wallet || wallet.chainId !== Number(selectedNetwork)) {
      return undefined;
    }

    const interval = setInterval(() => {
      refresh();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [refresh, selectedNetwork, wallet]);

  return {
    balances,
    isLoading,
    refresh,
  };
}
