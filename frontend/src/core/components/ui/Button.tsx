import React from 'react';
import clsx from 'clsx';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const sizeStyles = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.75rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.875rem' },
    lg: { padding: '0.875rem 1.75rem', fontSize: '1rem' },
  };

  return (
    <button
      className={clsx('btn', `btn-${variant}`, className)}
      style={sizeStyles[size]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};

export default Button;
