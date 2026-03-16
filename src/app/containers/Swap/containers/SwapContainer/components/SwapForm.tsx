import React from 'react';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';
import { Button, Input } from '@app/shared/components';
import Select, { Option } from '@app/shared/components/Select';

const SwapContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  min-height: 400px;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 15px;
`;

const FormTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 20px;
  margin-top: 20px;
  gap: 14px;
`;

const FormSubtitle = styled.p`
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2.4px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
`;

const AmountRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const OutputRow = styled(AmountRow)`
  margin-top: 6px;
`;

const TokenPill = styled.div`
  height: 44px;
  min-width: 120px;
  padding: 0 14px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const BalanceValue = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
`;

const FeeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
`;

const FeeItem = styled.div`
  flex: 1;
`;

const FeeValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #da68f5;
  margin-top: 10px;
`;

const NoticeText = styled.div<{ tone?: 'error' | 'muted' }>`
  font-size: 12px;
  color: ${({ tone }) => (tone === 'error' ? 'rgba(255, 100, 100, 0.9)' : 'rgba(255, 255, 255, 0.6)')};
`;

const SwapHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DirectionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const DirectionLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const DirectionButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const inputClass = css`
  flex: 1;
  margin-bottom: 0 !important;
`;

const tokenSelectClass = css`
  margin-left: 0 !important;

  > button {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    height: 44px;
    padding: 0 14px;
    background-color: rgba(255, 255, 255, 0.05);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
  }
`;

const inlineButtonClass = css`
  width: auto !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
`;

const invalidChars = ['-', '+', 'e', 'E'];

type SwapNotice = {
  message: string;
  tone?: 'error' | 'muted';
};

type SwapAmountProps = {
  value: string;
  error?: string;
  palette: 'purple' | 'blue';
  onChange: (value: string) => void;
  selectValue: number | string;
  selectOptions: Array<{ value: number | string; label: string }>;
  onSelect: (value: number | string) => void;
  availableLabel: string;
  onMax: () => void;
  isMaxDisabled: boolean;
  isLoadingBalances: boolean;
};

type SwapOutputProps = {
  value: string;
  palette: 'purple' | 'blue';
  tokenLabel: string;
};

type SwapFeesProps = {
  isBeamToEvm: boolean;
  beamRelayerFee: number;
  beamAssetLabel: string;
  feeFallback: boolean;
  transactionFee: number;
  evmRelayerFee: number;
  evmAssetLabel: string;
  networkStatus: string;
};

type SwapActionsProps = {
  showConnect: boolean;
  connectLabel: string;
  onConnect: () => void;
  showSwitch: boolean;
  switchLabel: string;
  onSwitch: () => void;
  isLoadingEth: boolean;
  submitLabel: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitPalette: 'purple' | 'blue';
};

export type SwapFormProps = {
  directionLabel: string;
  directionDescription: string;
  onToggleDirection: () => void;
  notices: SwapNotice[];
  amount: SwapAmountProps;
  output: SwapOutputProps;
  fees: SwapFeesProps;
  actions: SwapActionsProps;
  evmSubmitError?: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export const SwapForm = ({
  directionLabel,
  directionDescription,
  onToggleDirection,
  notices,
  amount,
  output,
  fees,
  actions,
  evmSubmitError,
  onSubmit,
}: SwapFormProps) => (
  <SwapContent>
    <Section>
      <SectionTitle>Swap</SectionTitle>
      <form onSubmit={onSubmit}>
        <FormContainer>
          <SwapHeader>
            <DirectionRow>
              <FormTitle>{directionLabel}</FormTitle>
              <DirectionLabel>{directionDescription}</DirectionLabel>
            </DirectionRow>
            <DirectionButton type="button" onClick={onToggleDirection}>
              Switch direction
            </DirectionButton>
          </SwapHeader>
          {notices.map((notice) => (
            <NoticeText key={notice.message} tone={notice.tone}>
              {notice.message}
            </NoticeText>
          ))}
          <FormSubtitle>AMOUNT</FormSubtitle>
          <AmountRow>
            <Input
              className={inputClass}
              variant="amount"
              pallete={amount.palette}
              margin="none"
              inputMode="decimal"
              placeholder="0.0"
              value={amount.value}
              onChange={(event) => amount.onChange(event.target.value)}
              label={amount.error}
              valid={!amount.error}
              onKeyDown={(event) => {
                if (invalidChars.includes(event.key)) {
                  event.preventDefault();
                }
              }}
            />
            <Select value={amount.selectValue} className={tokenSelectClass} onSelect={amount.onSelect}>
              {amount.selectOptions.map((option) => (
                <Option key={option.label} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </AmountRow>
          <BalanceRow>
            <span>Available</span>
            <BalanceValue>{amount.availableLabel}</BalanceValue>
            <Button
              className={inlineButtonClass}
              variant="link"
              pallete="green"
              onClick={amount.onMax}
              disabled={amount.isMaxDisabled}
            >
              max
            </Button>
          </BalanceRow>
          {amount.isLoadingBalances && <NoticeText tone="muted">Loading balances…</NoticeText>}

          <FormSubtitle>YOU WILL RECEIVE</FormSubtitle>
          <OutputRow>
            <Input
              className={inputClass}
              variant="amount"
              pallete={output.palette}
              margin="none"
              value={output.value}
              disabled
            />
            <TokenPill>{output.tokenLabel}</TokenPill>
          </OutputRow>

          <FeeContainer>
            {fees.isBeamToEvm ? (
              <>
                <FeeItem>
                  <FormSubtitle>RELAYER FEE</FormSubtitle>
                  <FeeValue>
                    {fees.beamRelayerFee.toFixed(8)}
                    {' '}
                    {fees.beamAssetLabel}
                  </FeeValue>
                  {fees.feeFallback && <NoticeText tone="muted">Using fallback fee</NoticeText>}
                </FeeItem>
                <FeeItem>
                  <FormSubtitle>TRANSACTION FEE</FormSubtitle>
                  <FeeValue>
                    {fees.transactionFee}
                    {' '}
                    BEAM
                  </FeeValue>
                </FeeItem>
              </>
            ) : (
              <>
                <FeeItem>
                  <FormSubtitle>RELAYER FEE</FormSubtitle>
                  <FeeValue>
                    {fees.evmRelayerFee}
                    {' '}
                    {fees.evmAssetLabel}
                  </FeeValue>
                </FeeItem>
                <FeeItem>
                  <FormSubtitle>NETWORK STATUS</FormSubtitle>
                  <FeeValue>{fees.networkStatus}</FeeValue>
                </FeeItem>
              </>
            )}
          </FeeContainer>
        </FormContainer>

        {evmSubmitError && <NoticeText tone="error">{evmSubmitError}</NoticeText>}

        <ButtonGroup>
          {actions.showConnect && (
            <Button pallete="green" onClick={actions.onConnect} disabled={actions.isLoadingEth}>
              {actions.connectLabel}
            </Button>
          )}
          {actions.showSwitch && (
            <Button pallete="purple" onClick={actions.onSwitch} disabled={actions.isLoadingEth}>
              {actions.switchLabel}
            </Button>
          )}
          <Button type="submit" disabled={!actions.canSubmit || actions.isSubmitting} pallete={actions.submitPalette}>
            {actions.submitLabel}
          </Button>
        </ButtonGroup>
      </form>
    </Section>
  </SwapContent>
);
