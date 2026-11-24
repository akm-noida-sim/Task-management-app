import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function Logo({ to = '/', compact = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="TaskFlow home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Task<span className="text-brand-600 dark:text-brand-400">Flow</span>
        </span>
      )}
    </Link>
  );
}
