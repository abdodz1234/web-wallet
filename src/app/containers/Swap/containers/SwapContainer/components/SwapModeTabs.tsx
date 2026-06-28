import React from 'react';
import { styled } from '@linaria/react';

export type SwapMode = 'cross-chain' | 'dex';

const TabRow = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 20px 14px;
  max-width: 676px;
  margin: 0 auto;
  width: 100%;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  height: 36px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  border: 1px solid ${({ active }) => (active ? 'rgba(218,104,245,0.35)' : 'rgba(255,255,255,0.08)')};
  background: ${({ active }) => (active ? 'rgba(218,104,245,0.12)' : 'transparent')};
  color: ${({ active }) => (active ? '#da68f5' : 'rgba(255,255,255,0.38)')};

  &:hover:not(:disabled) {
    background: rgba(218, 104, 245, 0.08);
    color: rgba(255, 255, 255, 0.7);
    border-color: rgba(218, 104, 245, 0.2);
  }
`;

interface SwapModeTabsProps {
  mode: SwapMode;
  onChange: (mode: SwapMode) => void;
}

export const SwapModeTabs = ({ mode, onChange }: SwapModeTabsProps) => (
  <TabRow>
    <Tab active={mode === 'cross-chain'} type="button" onClick={() => onChange('cross-chain')}>
      Cross-chain
    </Tab>
    <Tab active={mode === 'dex'} type="button" onClick={() => onChange('dex')}>
      On-chain DEX
    </Tab>
  </TabRow>
);
