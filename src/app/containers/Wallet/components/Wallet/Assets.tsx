import React from 'react';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';
import { convertLowAmount, fromGroths, truncate } from '@core/utils';
import { AssetIcon, Rate } from '@app/shared/components';
import { PALLETE_ASSETS, ROUTES } from '@app/shared/constants';
import { AssetTotal } from '@app/containers/Wallet/interfaces';
import { useNavigate } from 'react-router-dom';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
`;

const Tile = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, transform 0.12s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.13);
    transform: translateY(-1px);
  }
`;

const IconBox = styled.div<{ boxColor: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${({ boxColor }) => `${boxColor}1a`};
`;

const iconClass = css`
  margin-right: 0 !important;
  transform: none !important;
  top: auto !important;
  vertical-align: middle !important;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
`;

const AssetName = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 2px;
`;

const Amount = styled.div`
  font-size: 15px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const rateClass = css`
  margin: 0 !important;
  margin-top: 0 !important;
  font-size: 12px !important;
  color: rgba(255, 255, 255, 0.35) !important;
  font-weight: 500 !important;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
`;

interface AssetsProps {
  data: AssetTotal[];
  isBalanceHidden?: boolean;
}

function getColor(asset_id: number, opt_color?: string): string {
  if (opt_color) return opt_color;
  return PALLETE_ASSETS[asset_id] ?? PALLETE_ASSETS[asset_id % PALLETE_ASSETS.length];
}

const Assets: React.FC<AssetsProps> = ({ data, isBalanceHidden }) => {
  const navigate = useNavigate();

  return (
    <List>
      {data.map(({ asset_id, available, metadata_pairs }) => {
        const name = truncate(metadata_pairs?.UN) ?? '';
        const amount = fromGroths(available);
        const amountLabel = convertLowAmount(amount);
        const color = getColor(asset_id, metadata_pairs?.OPT_COLOR);
        const isBeam = name === 'BEAM';

        return (
          <Tile key={asset_id} onClick={() => navigate(`${ROUTES.ASSETS.DETAIL.replace(':id', '')}${asset_id}`)}>
            <IconBox boxColor={color}>
              <AssetIcon asset_id={asset_id} className={iconClass} />
            </IconBox>

            <Info>
              <AssetName>{name || `Asset #${asset_id}`}</AssetName>
              <Amount>{isBalanceHidden ? '••••••' : `${amountLabel}${name ? ` ${name}` : ''}`}</Amount>
            </Info>

            {isBeam && !isBalanceHidden && <Rate value={amount} className={rateClass} />}
          </Tile>
        );
      })}
    </List>
  );
};

export default Assets;
