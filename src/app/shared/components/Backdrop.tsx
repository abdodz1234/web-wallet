import React, { useRef } from 'react';
import { styled } from '@linaria/react';

interface BackDropProps {
  onCancel?: React.MouseEventHandler;
  children?: React.ReactNode;
}

const BackdropStyled = styled.div`
  position: absolute;
  z-index: 3;
  top: 50px;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(3, 36, 68, 0.3);
`;

const BackDrop: React.FC<BackDropProps> = ({ onCancel, children }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === rootRef.current) {
      onCancel?.(event);
    }
  };

  return (
    <BackdropStyled ref={rootRef} onClick={handleOutsideClick}>
      {children}
    </BackdropStyled>
  );
};

export default BackDrop;
