// @ts-nocheck
import React from 'react';
import { Rate } from '@app/shared/components';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';
import {
  fromGroths, compact, toGroths, getTxType, truncate, convertLowAmount,
} from '@core/utils';
import { AddressData } from '@core/types';
import { AssetTotal, TransactionAmount } from '@app/containers/Wallet/interfaces';
import { useSelector } from 'react-redux';
import { selectIsBalanceHidden } from '@app/shared/store/selectors';
import { selectParsedAddressUD } from '../../store/selectors';

// ── Layout ────────────────────────────────────────────────────────────────────

const ConfirmWrap = styled.form`
  width: 100%;
  max-width: 676px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  overflow: hidden;
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
`;

const RowLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  padding-top: 3px;
`;

const RowRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
`;

const RowValue = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
  word-break: break-all;
`;

const AmountValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: var(--color-purple);
  text-align: right;
`;

const subRateClass = css`
  margin: 0 !important;
  font-size: 11px !important;
  color: rgba(255, 255, 255, 0.3) !important;
  font-weight: 500 !important;
  text-align: right;
`;

const amountRateClass = css`
  margin: 0 !important;
  font-size: 12px !important;
  color: rgba(255, 255, 255, 0.4) !important;
  font-weight: 500 !important;
`;

// ── Button ────────────────────────────────────────────────────────────────────

const PrimaryBtn = styled.button`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: var(--color-purple);
  color: var(--color-dark-blue);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.12s;

  &:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: none;
    opacity: 1;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────

interface SendConfirmProps {
  address: string;
  offline: boolean;
  send_amount: TransactionAmount;
  selected: AssetTotal;
  beam: AssetTotal;
  addressData: AddressData;
  fee: number;
  change: number;
  asset_change: number;
  submitSend: () => void;
}

const SendConfirm = (props: SendConfirmProps) => {
  const {
    address, offline, send_amount, selected, addressData, fee, change, submitSend, beam, asset_change,
  } = props;

  const parsed_address_ud = useSelector(selectParsedAddressUD());
  const isBalanceHidden = useSelector(selectIsBalanceHidden());

  const { asset_id, amount } = send_amount;
  const value = toGroths(parseFloat(amount));
  const { available, metadata_pairs } = selected;
  const { type: addressType } = addressData;
  const remaining = asset_id === 0 ? available - fee - value : available - value;
  const txType = getTxType(addressType, offline);
  const beamRemaining = beam.available - fee;

  const displayAddress = parsed_address_ud ? compact(parsed_address_ud) : compact(address);

  return (
    <ConfirmWrap
      onSubmit={(e) => {
        e.preventDefault();
        submitSend();
      }}
    >
      <SummaryCard>
        <Row>
          <RowLabel>Send to</RowLabel>
          <RowRight>
            <RowValue>{displayAddress}</RowValue>
          </RowRight>
        </Row>

        <Row>
          <RowLabel>Type</RowLabel>
          <RowRight>
            <RowValue>{txType}</RowValue>
          </RowRight>
        </Row>

        {!isBalanceHidden && (
          <>
            <Row>
              <RowLabel>Amount</RowLabel>
              <RowRight>
                <AmountValue>
                  {convertLowAmount(Number(amount))}
                  &nbsp;
                  {truncate(metadata_pairs.UN)}
                </AmountValue>
                {selected.asset_id === 0 && <Rate value={value} groths className={amountRateClass} />}
              </RowRight>
            </Row>

            <Row>
              <RowLabel>Fee</RowLabel>
              <RowRight>
                <RowValue>
                  {convertLowAmount(fromGroths(fee))}
                  &nbsp;BEAM
                </RowValue>
                <Rate value={fee} groths className={subRateClass} />
              </RowRight>
            </Row>

            <Row>
              <RowLabel>Change</RowLabel>
              <RowRight>
                <RowValue>
                  {convertLowAmount(fromGroths(selected.asset_id === 0 ? change : asset_change))}
                  &nbsp;
                  {truncate(metadata_pairs.UN)}
                </RowValue>
                <Rate value={selected.asset_id === 0 ? change : asset_change} groths className={subRateClass} />
              </RowRight>
            </Row>

            <Row>
              <RowLabel>Remaining</RowLabel>
              <RowRight>
                <RowValue>
                  {convertLowAmount(fromGroths(remaining))}
                  &nbsp;
                  {truncate(metadata_pairs.UN)}
                </RowValue>
                <Rate value={remaining} groths className={subRateClass} />
              </RowRight>
            </Row>

            {selected.asset_id !== 0 && (
              <Row>
                <RowLabel>BEAM Remaining</RowLabel>
                <RowRight>
                  <RowValue>
                    {convertLowAmount(fromGroths(beamRemaining))}
                    &nbsp;BEAM
                  </RowValue>
                  <Rate value={beamRemaining} groths className={subRateClass} />
                </RowRight>
              </Row>
            )}
          </>
        )}
      </SummaryCard>

      <PrimaryBtn type="submit">Send</PrimaryBtn>
    </ConfirmWrap>
  );
};

export default SendConfirm;
