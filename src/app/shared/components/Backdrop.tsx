import React, { useRef } from 'react';
import { styled } from '@linaria/react';

interface BackDropProps {
  onCancel?: React.MouseEventHandler;
  closing?: boolean;
  children?: React.ReactNode;
}

const BackdropStyled = styled.div<{ closing: boolean }>`
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  animation: ${({ closing }) => (closing ? 'backdropFadeOut' : 'backdropFadeIn')} 0.25s ease forwards;

  @keyframes backdropFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes backdropFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

const BackDrop: React.FC<BackDropProps> = ({ onCancel, closing = false, children }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === rootRef.current) {
      onCancel?.(event);
    }
  };

  return (
    <BackdropStyled ref={rootRef} closing={closing} onClick={handleOutsideClick}>
      {children}
    </BackdropStyled>
  );
};

export default BackDrop;
