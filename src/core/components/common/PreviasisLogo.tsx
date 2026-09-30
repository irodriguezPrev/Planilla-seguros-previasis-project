import React from 'react';

interface PreviasisLogoProps {
  size?: number; // Altura en px
  showText?: boolean;
  textColor?: string;
  className?: string;
  lightBackground?: boolean;
}

export const PreviasisLogo: React.FC<PreviasisLogoProps> = ({
  size = 44,
  showText = true,
  textColor = '#073E23',
  className = '',
  lightBackground = false,
}) => {
  return (
    <div
      className={`previasis-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.625rem',
        textDecoration: 'none',
      }}
    >
      <img
        src="/images/logo-previasis-horizontal.png"
        alt="PREVIASIS Medicina Prepagada S.A."
        style={{
          height: `${size}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: lightBackground ? 'none' : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08))',
        }}
      />
    </div>
  );
};

export default PreviasisLogo;
