// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';

import { Window, Loader } from '@app/shared/components';
import { ArrowUpIcon, ArrowDownIcon, ArrowsTowards } from '@app/shared/icons';

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@app/shared/constants';
import { useDispatch, useSelector } from 'react-redux';
import { selectAssets, selectRate } from '@app/containers/Wallet/store/selectors';

import { loadRate, getAssetList } from '@app/containers/Wallet/store/actions';
import { TransactionList } from '@app/containers/Transactions';
import { createdComparator } from '@core/utils';
import { selectTransactions } from '@app/containers/Transactions/store/selectors';
import { selectIsBalanceHidden, selectAssetSync, selectIsLoading } from '@app/shared/store/selectors';
import { Assets } from '../../components/Wallet';

const TXS_MAX = 4;

type WalletTab = 'assets' | 'transactions';

const PageWrap = styled.div`
  width: 100%;
  max-width: 676px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  :global(html[data-env='fullscreen']) & {
    max-width: 660px;
    gap: 16px;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionBtn = styled.button<{ accent: 'purple' | 'green' | 'blue' }>`
  flex: 1;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.12s;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  position: relative;
  z-index: 3;

  > svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: ${({ accent }) => `var(--color-${accent})`};
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    transform: translateY(-1px);
  }

  &:active {
    transform: none;
    background: rgba(255, 255, 255, 0.06);
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
  overflow: hidden;

  :global(html[data-env='fullscreen']) & {
    padding: 22px;
  }
`;

const TabsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const TabList = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
`;

const TabButton = styled.button<{ active?: boolean }>`
  border: none;
  cursor: pointer;
  padding: 8px 2px;
  background: transparent;
  color: ${({ active }) => (active ? 'white' : 'rgba(255, 255, 255, 0.45)')};
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 11px;
  transition: color 120ms ease;
  border-bottom: 2px solid ${({ active }) => (active ? 'var(--color-green)' : 'transparent')};

  &:hover {
    color: white;
  }
`;

const TabCount = styled.span`
  margin-left: 6px;
  opacity: 0.45;
  font-weight: 700;
`;

const TabRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ShowAllBtn = styled.button`
  border: none;
  background: transparent;
  color: var(--color-green);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  letter-spacing: 0.02em;

  &:hover {
    opacity: 0.85;
  }
`;

const txListClass = css`
  margin: 0 !important;
`;

const txItemClass = css`
  background-color: transparent !important;
  border-radius: 12px !important;
  padding: 12px !important;
  margin: 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    transform: translateY(-1px);
  }
`;

const Wallet = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const assets = useSelector(selectAssets());
  const transactions = useSelector(selectTransactions());
  const isBalanceHidden = useSelector(selectIsBalanceHidden());
  const isAssetSynced = useSelector(selectAssetSync());
  const isLoading = useSelector(selectIsLoading());
  const rate = useSelector(selectRate());
  const [activeTab, setActiveTab] = useState<WalletTab>('assets');

  useEffect(() => {
    if (!isAssetSynced) {
      setTimeout(() => {
        dispatch(getAssetList.request({ refresh: true }));
      }, 10000);
    }
  }, [dispatch, isAssetSynced]);

  useEffect(() => {
    if (!rate) {
      dispatch(loadRate.request());
    }
  }, [dispatch, rate]);

  const sorted = transactions.slice().sort(createdComparator);
  const txs = sorted.slice(0, TXS_MAX);
  const assts = assets.slice(0, TXS_MAX);

  const navigateToTransactions = useCallback(() => {
    navigate(ROUTES.TRANSACTIONS.BASE);
  }, [navigate]);

  const navigateToAssets = useCallback(() => {
    navigate(ROUTES.ASSETS.BASE);
  }, [navigate]);

  const navigateToActiveTab = useCallback(() => {
    if (activeTab === 'assets') navigateToAssets();
    else navigateToTransactions();
  }, [activeTab, navigateToAssets, navigateToTransactions]);

  const hasMore = activeTab === 'assets' ? assets.length > TXS_MAX : sorted.length > TXS_MAX;

  return (
    <Window title="Wallet" primary showHideButton>
      <PageWrap>
        <QuickActions>
          <ActionBtn accent="purple" type="button" onClick={() => navigate(ROUTES.WALLET.SEND)}>
            <ArrowUpIcon />
            Send
          </ActionBtn>
          <ActionBtn accent="green" type="button" onClick={() => navigate(ROUTES.SWAP.BASE)}>
            <ArrowsTowards />
            Swap
          </ActionBtn>
          <ActionBtn accent="blue" type="button" onClick={() => navigate(ROUTES.WALLET.RECEIVE)}>
            <ArrowDownIcon />
            Receive
          </ActionBtn>
        </QuickActions>

        <Card>
          <TabsRow>
            <TabList role="tablist" aria-label="Wallet sections">
              <TabButton
                type="button"
                role="tab"
                aria-selected={activeTab === 'assets'}
                active={activeTab === 'assets'}
                onClick={() => setActiveTab('assets')}
              >
                Assets
                <TabCount>{assets.length}</TabCount>
              </TabButton>
              <TabButton
                type="button"
                role="tab"
                aria-selected={activeTab === 'transactions'}
                active={activeTab === 'transactions'}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
                <TabCount>{sorted.length}</TabCount>
              </TabButton>
            </TabList>

            <TabRight>
              {isLoading && <Loader />}
              {hasMore && (
                <ShowAllBtn type="button" onClick={navigateToActiveTab}>
                  Show all
                </ShowAllBtn>
              )}
            </TabRight>
          </TabsRow>

          <div role="tabpanel">
            {activeTab === 'assets' ? (
              <Assets data={assts} isBalanceHidden={isBalanceHidden} />
            ) : (
              <TransactionList
                data={txs}
                isBalanceHidden={isBalanceHidden}
                className={txListClass}
                itemClassName={txItemClass}
              />
            )}
          </div>
        </Card>
      </PageWrap>
    </Window>
  );
};

export default Wallet;
