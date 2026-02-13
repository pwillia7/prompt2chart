import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2.5 bg-[var(--surface-1)] border rounded-[10px]
            text-[var(--text)] placeholder:text-[var(--text-subtle)]
            focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-fast
            ${error ? 'border-[var(--danger)]' : 'border-[var(--border-strong)]'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--danger)]">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
