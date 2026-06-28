import React, { useCallback, useMemo, useState } from 'react';
import { Window } from '@app/shared/components';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAssets } from '@app/containers/Wallet/store/selectors';
import { Assets } from '@app/containers/Wallet/components/Wallet';
import { selectIsBalanceHidden } from '@app/shared/store/selectors';
import { TransactionList } from '@app/containers/Transactions';
import { selectTransactions } from '@app/containers/Transactions/store/selectors';
import { ROUTES } from '@app/shared/constants';
import { truncate } from '@core/utils';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';
import { ArrowUpIcon, ArrowDownIcon, ArrowsTowards } from '@app/shared/icons';
import { setSelectedAssetId } from '@app/containers/Wallet/store/actions';

const PageWrap = styled.div`
  width: 100%;
  max-width: 676px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
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

type DetailTab = 'balance' | 'transactions';

const AssetDetail = () => {
  const [activeTab, setActiveTab] = useState<DetailTab>('balance');
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const assets = useSelector(selectAssets());
  const transactions = useSelector(selectTransactions());
  const isBalanceHidden = useSelector(selectIsBalanceHidden());

  const currentAsset = useMemo(() => assets.find((a) => a.asset_id?.toString() === params?.id), [params?.id, assets]);

  const filtered = transactions.filter((tx) => tx.asset_id?.toString() === params?.id);
  const txs = showAll ? filtered : filtered.slice(0, 4);

  const navigateToAssets = useCallback(() => {
    navigate(ROUTES.ASSETS.BASE);
  }, [navigate]);

  const handleSend = useCallback(() => {
    if (currentAsset?.asset_id !== undefined) dispatch(setSelectedAssetId(currentAsset.asset_id));
    navigate(ROUTES.WALLET.SEND);
  }, [navigate, dispatch, currentAsset?.asset_id]);

  const handleSwap = useCallback(() => {
    if (currentAsset?.asset_id !== undefined) dispatch(setSelectedAssetId(currentAsset.asset_id));
    navigate(ROUTES.SWAP.BASE);
  }, [navigate, dispatch, currentAsset?.asset_id]);

  const handleReceive = useCallback(() => {
    if (currentAsset?.asset_id !== undefined) dispatch(setSelectedAssetId(currentAsset.asset_id));
    navigate(ROUTES.WALLET.RECEIVE);
  }, [navigate, dispatch, currentAsset?.asset_id]);

  return (
    <Window title={truncate(currentAsset?.metadata_pairs.UN)} showHideButton onPrevious={navigateToAssets}>
      <PageWrap>
        <QuickActions>
          <ActionBtn accent="purple" type="button" onClick={handleSend}>
            <ArrowUpIcon />
            Send
          </ActionBtn>
          <ActionBtn accent="green" type="button" onClick={handleSwap}>
            <ArrowsTowards />
            Swap
          </ActionBtn>
          <ActionBtn accent="blue" type="button" onClick={handleReceive}>
            <ArrowDownIcon />
            Receive
          </ActionBtn>
        </QuickActions>

        <Card>
          <TabsRow>
            <TabList role="tablist">
              <TabButton
                type="button"
                role="tab"
                active={activeTab === 'balance'}
                onClick={() => setActiveTab('balance')}
              >
                Balance
              </TabButton>
              <TabButton
                type="button"
                role="tab"
                active={activeTab === 'transactions'}
                onClick={() => setActiveTab('transactions')}
              >
                Transactions
                <TabCount>{filtered.length}</TabCount>
              </TabButton>
            </TabList>

            {activeTab === 'transactions' && filtered.length > 4 && (
              <ShowAllBtn type="button" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Show less' : 'Show all'}
              </ShowAllBtn>
            )}
          </TabsRow>

          <div role="tabpanel">
            {activeTab === 'balance' ? (
              <Assets data={currentAsset ? [currentAsset] : []} isBalanceHidden={isBalanceHidden} />
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

export default AssetDetail;
