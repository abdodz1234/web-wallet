// @ts-nocheck
import React from 'react';
import { styled } from '@linaria/react';

import {
  TxCanceledIcon,
  TxCanceledMPIcon,
  TxCanceledOffIcon,
  TxCompletedIcon,
  TxSentOfflineMPOwnIcon,
  TxCompletedMPIcon,
  TxCompletedOffIcon,
  TxCompletedOwnIcon,
  TxPendingIcon,
  TxPendingMPIcon,
  TxPendingOffIcon,
  TxPendingOwnIcon,
  TxExpiredIcon,
} from '@app/shared/icons';

import { Transaction, TxStatus, TxStatusString } from '@core/types';

interface StatusLabelProps {
  data: Transaction;
  className?: string;
}

const ContainerStyled = styled.div<{ fg: string; bg: string; border: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid ${({ border }) => border};
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
`;

const IconStyled = styled.div<{ reverse: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Keep a slightly larger box so SVG strokes don't get clipped. */
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  line-height: 0;
  overflow: hidden;
  transform-origin: 50% 50%;
  /* Small upward nudge keeps icons visually centered (some SVGs have extra bottom space). */
  transform: ${({ reverse }) => (reverse ? 'translateY(-1px) rotate(180deg)' : 'translateY(-1px)')};

  > svg {
    width: 10px;
    height: 10px;
    display: block;
  }
`;

function getIconPos(status: TxStatus): number {
  switch (status) {
    case TxStatus.COMPLETED:
      return 1;
    case TxStatus.CANCELED:
    case TxStatus.FAILED:
      return 2;
    default:
      return 0;
  }
}

const ICONS_OFFLINE = [TxPendingOffIcon, TxCompletedOffIcon, TxCanceledOffIcon];
const ICONS_MAX_PRIVACY = [TxPendingMPIcon, TxCompletedMPIcon, TxCanceledMPIcon];
const ICONS_REGULAR = [TxPendingIcon, TxCompletedIcon, TxCanceledIcon];

function getIconComponent({ status, status_string }: Transaction): React.FC {
  const pos = getIconPos(status);
  const offline = status_string.includes('offline');
  const maxPrivacy = status_string.includes('max privacy') || status_string.includes('maximum anonymity');

  switch (true) {
    case status_string === TxStatusString.EXPIRED:
      return TxExpiredIcon;
    case status_string === TxStatusString.SELF_SENDING:
      return TxPendingOwnIcon;
    case status_string === TxStatusString.SENT_TO_OWN_ADDRESS:
      return TxCompletedOwnIcon;
    case status_string === TxStatusString.SENT_OFFLINE_TO_OWN_ADDRESS:
      return TxSentOfflineMPOwnIcon;
    case offline:
      return ICONS_OFFLINE[pos];
    case maxPrivacy:
      return ICONS_MAX_PRIVACY[pos];
    default:
      return ICONS_REGULAR[pos];
  }
}

function getIconColor({ income, status, status_string }: Transaction): string {
  switch (true) {
    case status_string === TxStatusString.SELF_SENDING:
    case status_string === TxStatusString.SENT_TO_OWN_ADDRESS:
      return 'white';
    case status_string === TxStatusString.EXPIRED:
    case status === TxStatus.CANCELED:
      return 'var(--color-gray)';
    case status === TxStatus.FAILED:
      return 'var(--color-red)';
    default:
      return income ? 'var(--color-blue)' : 'var(--color-purple)';
  }
}

function getPillColors(data: Transaction): { fg: string; bg: string; border: string } {
  const fg = getIconColor(data);
  switch (true) {
    case data.status_string === TxStatusString.SELF_SENDING:
    case data.status_string === TxStatusString.SENT_TO_OWN_ADDRESS:
      return { fg: 'white', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)' };
    case data.status_string === TxStatusString.EXPIRED:
    case data.status === TxStatus.CANCELED:
      return { fg, bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' };
    case data.status === TxStatus.FAILED:
      return { fg, bg: 'rgba(255, 98, 92, 0.12)', border: 'rgba(255, 98, 92, 0.25)' };
    default:
      return data.income
        ? { fg, bg: 'rgba(103, 184, 246, 0.14)', border: 'rgba(103, 184, 246, 0.28)' }
        : { fg, bg: 'rgba(152, 99, 255, 0.14)', border: 'rgba(152, 99, 255, 0.28)' };
  }
}

const StatusLabel: React.FC<StatusLabelProps> = ({ data, className }) => {
  const { fg, bg, border } = getPillColors(data);
  const IconComponent = getIconComponent(data);
  return (
    <ContainerStyled fg={fg} bg={bg} border={border} className={className}>
      <IconStyled
        reverse={
          data.status_string === TxStatusString.EXPIRED
          || data.status_string === TxStatusString.SENT_OFFLINE_TO_OWN_ADDRESS
            ? false
            : !data.income
        }
      >
        <IconComponent />
      </IconStyled>
      {data.status_string}
    </ContainerStyled>
  );
};

export default StatusLabel;
