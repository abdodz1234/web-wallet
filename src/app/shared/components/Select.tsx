import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@linaria/react';
import { css } from '@linaria/core';
import config from '@app/config';
import Angle from './Angle';

const ContainerStyled = styled.div`
  display: inline-block;
  position: relative;
  margin-left: 10px;
`;

const SelectStyled = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  margin-top: 8px;
  padding: 10px 0;
  border-radius: 10px;
  background-color: ${`var(--color-popup-${config.theme})`};
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  min-width: 120px;
`;

const OptionStyled = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;

  &:hover,
  &:active {
    background-color: rgba(255, 255, 255, 0.07);
  }
`;

const OptionActiveStyled = styled(OptionStyled)`
  cursor: default;
  color: var(--color-green);

  &:hover,
  &:active {
    background-color: transparent;
  }
`;

const ButtonStyled = styled.button`
  line-height: 26px;
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  padding: 0;
  border: none;
  background-color: transparent;
  text-decoration: none;
  color: white;
  white-space: nowrap;

  &:hover,
  &:active {
    background-color: transparent;
  }
`;

const angleStyle = css`
  display: inline-block;
  vertical-align: text-top;
  margin-left: 8px;
`;

interface OptionProps {
  // eslint-disable-next-line
  value: any;
  active?: boolean;
  onClick?: React.MouseEventHandler;
  children?: React.ReactNode;
}

export const Option: React.FC<OptionProps> = ({ active, children, onClick }) => {
  if (active) {
    return <OptionActiveStyled>{children}</OptionActiveStyled>;
  }

  return <OptionStyled onClick={onClick}>{children}</OptionStyled>;
};

interface SelectProps<T = any> {
  value: T;
  className?: string;
  onSelect: (value: T) => void;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value, className, children, onSelect,
}) => {
  const [opened, setOpened] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened) return undefined;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpened(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [opened]);

  const array = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<OptionProps>[];

  const disabled = array.length === 1;

  const options = array.map((child) => {
    const { value: next } = child.props;
    const active = value === next;

    const handleClick: React.MouseEventHandler<HTMLElement> = (event) => {
      if (active) {
        event.preventDefault();
        return;
      }
      onSelect(next);
      setOpened(false);
    };

    return React.cloneElement(child, {
      active,
      onClick: handleClick,
    } as Partial<OptionProps>);
  });

  const selected = array.find((child) => value === child.props.value) ?? array[0];

  const handleToggle = () => {
    setOpened((v) => !v);
  };

  return (
    <ContainerStyled ref={containerRef} className={className}>
      <ButtonStyled type="button" onClick={handleToggle} disabled={disabled}>
        {selected?.props.children}
        {options.length > 1 && <Angle className={angleStyle} value={opened ? 0 : 180} margin={opened ? 3 : 1} />}
      </ButtonStyled>

      {opened && <SelectStyled>{options}</SelectStyled>}
    </ContainerStyled>
  );
};

export default Select;
