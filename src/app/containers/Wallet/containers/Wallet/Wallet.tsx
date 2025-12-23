// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';

import { Window, WalletActions, Loader } from '@app/shared/components';

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
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px;

  :global(html[data-env='fullscreen']) & {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    gap: 20px;
  }
`;

const ContentWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Header = styled.div`
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);

  :global(html[data-env='fullscreen']) & {
    padding: 22px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
`;

const ActionsWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 240px;

  :global(html[data-env='popup']) & {
    align-items: center;
    min-width: auto;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  :global(html[data-env='popup']) & {
    justify-content: center;
  }
`;

const actionButtonClass = css`
  width: 165px !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 10px 16px !important;
  min-height: 43px !important;
  border-radius: 10px !important;
  font-size: 13px !important;
  letter-spacing: 0.01em;
  box-shadow: none !important;
  white-space: nowrap;

  :global(html[data-env='popup']) & {
    width: 144px !important;
    padding: 10px 12px !important;
    min-height: 43px !important;
  }

  :global(html[data-env='fullscreen']) & {
    width: 186px !important;
    padding: 12px 18px !important;
    min-height: 48px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px;
  overflow: hidden;

  :global(html[data-env='fullscreen']) & {
    padding: 22px;
  }
`;

const CardAction = styled.button`
  border: none;
  background: transparent;
  color: var(--color-green);
  font-weight: 700;
  cursor: pointer;
  padding: 8px 0;
  letter-spacing: 0.02em;

  &:hover {
    opacity: 0.9;
  }
`;

const TabsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const TabList = styled.div`
  display: flex;
  gap: 18px;
  align-items: flex-end;
  padding-bottom: 6px;
`;

const TabButton = styled.button<{ active?: boolean }>`
  border: none;
  cursor: pointer;
  padding: 10px 2px;
  border-radius: 0;
  background: transparent;
  color: ${({ active }) => (active ? 'white' : 'rgba(255, 255, 255, 0.70)')};
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
  transition: color 120ms ease;
  border-bottom: 2px solid ${({ active }) => (active ? 'var(--color-green)' : 'transparent')};

  &:hover {
    color: white;
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 246, 210, 0.35);
    outline-offset: 4px;
  }
`;

const TabCount = styled.span`
  margin-left: 8px;
  opacity: 0.65;
  font-weight: 800;
`;

const assetsGridClass = css`
  margin: 0 !important;
  padding: 0 !important;
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 12px;

  :global(html[data-env='fullscreen']) & {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 14px;
  }
`;

const assetTileClass = css`
  cursor: pointer;
  border-radius: 14px;
  transition: transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
  width: 100% !important;
  margin: 0 !important;
  min-height: 98px;
  padding: 18px !important;
  padding-left: 60px !important;

  &:before {
    display: none !important;
  }

  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);

  &:hover {
    transform: translateY(-1px);
    opacity: 1;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
  }

  :global(html[data-env='fullscreen']) & {
    min-height: 104px;
    padding: 20px !important;
    padding-left: 64px !important;
  }
`;

const txListClass = css`
  margin: 0 !important;
`;

const txItemClass = css`
  background-color: transparent !important;
  border-radius: 14px;
  padding: 14px !important;
  margin: 0 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.04) !important;
    border-color: rgba(255, 255, 255, 0.12);
  }

  &:last-child {
    margin-bottom: 0;
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

  // useEffect(() => {
  //   if (!isAssetsRequested && assets.length) {
  //     setTimeout(() => {
  //       const a = assets
  //         .filter((item1) => !assets_info.some((item2) => item2.asset_id === item1.asset_id))
  //         .filter((ass) => ass.asset_id !== 0);
  //
  //       if (a.length) {
  //         const ids = a.map((a) => a.asset_id);
  //         dispatch(getAssetInfo.request(ids));
  //       }
  //     }, 10000);
  //     setIsAssetsRequested(true);
  //   }
  // }, [assets, assets_info, isAssetsRequested]);

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
    if (activeTab === 'assets') {
      navigateToAssets();
    } else {
      navigateToTransactions();
    }
  }, [activeTab, navigateToAssets, navigateToTransactions]);

  return (
    <Window title="Wallet" primary showHideButton>
      <PageWrap>
        <Header>
          <HeaderRow>
            <ActionsWrap>
              <ActionsRow>
                <WalletActions className="compact" buttonClassName={actionButtonClass} />
              </ActionsRow>
              {isLoading && <Loader />}
            </ActionsWrap>
          </HeaderRow>
        </Header>

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

            {(activeTab === 'assets' ? assets.length > TXS_MAX : sorted.length > TXS_MAX) ? (
              <CardAction onClick={navigateToActiveTab}>Show all</CardAction>
            ) : null}
          </TabsRow>

          <ContentWrap role="tabpanel">
            {activeTab === 'assets' ? (
              <Assets
                data={assts}
                isBalanceHidden={isBalanceHidden}
                listClassName={assetsGridClass}
                assetClassName={assetTileClass}
              />
            ) : (
              <TransactionList
                data={txs}
                isBalanceHidden={isBalanceHidden}
                className={txListClass}
                itemClassName={txItemClass}
              />
            )}
          </ContentWrap>
        </Card>
      </PageWrap>
    </Window>
  );
};

export default Wallet;
