import { cn } from '@/lib/utils';

const VARIANT_STYLES = {
  default: 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm',
  ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 shadow-sm',
};

export function Button({ className, variant = 'default', disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
