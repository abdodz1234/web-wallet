import React from 'react';

import { styled } from '@linaria/react';
import { css } from '@linaria/core';

import {
  CancelIcon, DexIcon, HelpIcon, SettingsIcon, WalletIcon,
} from '@app/shared/icons';

import { ROUTES } from '@app/shared/constants';
import { useNavigate, useLocation } from 'react-router-dom';
import config from '@app/config';
import Button from './Button';
import BackDrop from './Backdrop';

const MENU_ITEMS = [
  {
    title: 'Wallet',
    value: ROUTES.WALLET.BASE,
    IconComponent: WalletIcon,
  },
  {
    title: 'Settings',
    value: ROUTES.SETTINGS.BASE,
    IconComponent: SettingsIcon,
  },
  {
    title: 'DEX',
    value: ROUTES.DEX.BASE,
    IconComponent: DexIcon,
    className: 'dex',
  },
  {
    title: 'Documentation',
    value: 'https://beam.mw/docs',
    outside: true,
    IconComponent: HelpIcon,
  },
];

const ContainerStyled = styled.nav<{ closing: boolean }>`
  position: fixed;
  z-index: 101;
  top: 0;
  left: 0;
  width: 319px;
  height: 100vh;
  background: ${`var(--color-popup-${config.theme})`};
  animation: ${({ closing }) => (closing ? 'menuSlideOut' : 'menuSlideIn')} 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  will-change: transform;
  overflow: hidden;

  @keyframes menuSlideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes menuSlideOut {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
`;

const ListStyled = styled.ul`
  padding-top: 80px;
`;

const ListItemStyled = styled.li<{ active: boolean }>`
  height: 60px;
  line-height: 60px;
  padding-left: 30px;
  background-image: ${({ active }) => (!active ? 'none' : 'linear-gradient(to right, rgba(5, 226, 194, 0.1), rgba(5, 226, 194, 0))')};
  text-align: left;
  font-size: 16px;
  cursor: ${({ active }) => (active ? 'default' : 'pointer')};
  display: flex;
  align-items: center;
  > svg {
    margin-right: 26px;
  }
  &.dex {
    > svg {
      margin-left: -10px;
      margin-right: 16px;
    }
  }
`;

const buttonStyle = css`
  position: absolute;
  top: 24px;
  left: 24px;
  margin: 0;
`;

interface MenuProps {
  onCancel?: React.MouseEventHandler;
  closing?: boolean;
}

const Menu: React.FC<MenuProps> = ({ onCancel, closing = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick: React.MouseEventHandler<HTMLLIElement> = ({ currentTarget }) => {
    const index = parseInt(currentTarget.dataset.index, 10);
    const item = MENU_ITEMS[index];
    if (!item.outside) {
      navigate(item.value);
    } else {
      window.open(item.value);
    }
  };

  return (
    <BackDrop onCancel={onCancel} closing={closing}>
      <ContainerStyled closing={closing}>
        <Button variant="icon" icon={CancelIcon} className={buttonStyle} onClick={onCancel} />
        <ListStyled>
          {MENU_ITEMS.map(({
            title, value, className, IconComponent,
          }, index) => (
            <ListItemStyled
              key={value}
              active={location.pathname === value}
              data-index={index}
              onClick={handleClick}
              className={className}
            >
              <IconComponent />
              {title}
            </ListItemStyled>
          ))}
        </ListStyled>
      </ContainerStyled>
    </BackDrop>
  );
};

export default Menu;
