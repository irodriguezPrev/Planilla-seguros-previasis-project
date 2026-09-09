import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = true,
  style,
  ...props
}) => {
  return (
    <div
      className={clsx(glass && 'glass-card', className)}
      style={{
        padding: '1.5rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
