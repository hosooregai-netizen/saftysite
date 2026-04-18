'use client';

import type { InputHTMLAttributes } from 'react';

interface SubmitSearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  busy?: boolean;
  busyLabel?: string;
  buttonAriaLabel?: string;
  buttonClassName?: string;
  buttonLabel?: string;
  formClassName?: string;
  inputClassName?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
}

export function SubmitSearchField({
  busy = false,
  busyLabel = '검색 중',
  buttonAriaLabel,
  buttonClassName,
  buttonLabel = '검색',
  formClassName,
  inputClassName,
  onChange,
  onSubmit,
  value,
  ...inputProps
}: SubmitSearchFieldProps) {
  return (
    <div
      role="search"
      className={formClassName}
    >
      <input
        {...inputProps}
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          inputProps.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key !== 'Enter') return;
          if (busy) return;
          event.preventDefault();
          event.stopPropagation();
          onSubmit();
        }}
      />
      <button
        type="button"
        className={buttonClassName}
        aria-label={buttonAriaLabel ?? (busy ? busyLabel : buttonLabel)}
        disabled={busy}
        onClick={() => {
          if (busy) return;
          onSubmit();
        }}
      >
        {busy ? busyLabel : buttonLabel}
      </button>
    </div>
  );
}
