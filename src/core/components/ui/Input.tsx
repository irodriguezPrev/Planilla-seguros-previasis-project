import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="input-group">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}{required && !label.trim().endsWith('*') ? ' *' : ''}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx('input-field', error && 'border-error', className)}
          style={error ? { borderColor: 'var(--status-error)' } : undefined}
          required={required}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--status-error)' }}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
