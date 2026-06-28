import React, { useCallback } from 'react';
import { Window } from '@app/shared/components';
import { useSelector } from 'react-redux';
import { selectAssets } from '@app/containers/Wallet/store/selectors';
import { selectIsBalanceHidden } from '@app/shared/store/selectors';
import { ROUTES } from '@app/shared/constants';
import { useNavigate } from 'react-router-dom';
import { styled } from '@linaria/react';
import { ArrowUpIcon, ArrowDownIcon, ArrowsTowards } from '@app/shared/icons';
import { Assets } from '../../../Wallet/components/Wallet';

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

const AssetsList = () => {
  const navigate = useNavigate();
  const isBalanceHidden = useSelector(selectIsBalanceHidden());
  const assets = useSelector(selectAssets());

  const navigateToWallet = useCallback(() => {
    navigate(ROUTES.WALLET.BASE);
  }, [navigate]);

  return (
    <Window title="Assets" showHideButton onPrevious={navigateToWallet}>
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
          <Assets data={assets} isBalanceHidden={isBalanceHidden} />
        </Card>
      </PageWrap>
    </Window>
  );
};

export default AssetsList;
