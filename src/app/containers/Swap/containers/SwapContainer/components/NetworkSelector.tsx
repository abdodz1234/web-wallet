import React from 'react';
import { styled } from '@linaria/react';

// Segmented-control track
const Track = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  margin-bottom: 10px;
`;

const Segment = styled.button<{ active?: boolean; warn?: boolean }>`
  flex: 1;
  height: 30px;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: background 0.15s, color 0.15s;

  background: ${({ active, warn }) => {
    if (active && warn) return 'rgba(255, 165, 0, 0.15)';
    if (active) return 'rgba(218, 104, 245, 0.18)';
    return 'transparent';
  }};

  color: ${({ active, warn }) => {
    if (active && warn) return '#ffb340';
    if (active) return '#da68f5';
    return 'rgba(255, 255, 255, 0.4)';
  }};

  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? undefined : 'rgba(255,255,255,0.06)')};
    color: ${({ active }) => (active ? undefined : 'rgba(255,255,255,0.7)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const WarnDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffb340;
  flex-shrink: 0;
`;

export type NetworkOption = {
  id: string;
  label: string;
};

export type NetworkSelectorProps = {
  networks: NetworkOption[];
  selected: string;
  connectedChainId?: number | null;
  onSelect: (networkId: string) => void;
  disabled?: boolean;
};

export const NetworkSelector = ({
  networks, selected, connectedChainId, onSelect, disabled,
}: NetworkSelectorProps) => (
  <Track>
    {networks.map((net) => {
      const isActive = net.id === selected;
      const warn = isActive && connectedChainId != null && String(connectedChainId) !== selected;
      return (
        <Segment
          key={net.id}
          type="button"
          active={isActive}
          warn={warn}
          disabled={disabled}
          onClick={() => onSelect(net.id)}
        >
          {warn && <WarnDot />}
          {net.label}
        </Segment>
      );
    })}
  </Track>
);
