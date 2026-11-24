import { LoaderCircle } from 'lucide-react';
import { cn } from '../utils/formatters';

export default function LoadingSpinner({ label = 'Loading…', small = false, className = '' }) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400', className)}
    >
      <LoaderCircle className={cn('animate-spin text-brand-600', small ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
