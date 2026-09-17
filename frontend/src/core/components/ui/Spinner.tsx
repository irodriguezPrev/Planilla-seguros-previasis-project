import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'currentColor' }) => {
  const pixelSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const s = pixelSizes[size];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="40 60"
        strokeLinecap="round"
      />
      <style suppressHydrationWarning>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
};

export default Spinner;
