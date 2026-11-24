import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total_pages <= 1) return null;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800" aria-label="Pagination">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing page <span className="font-semibold text-slate-700 dark:text-slate-200">{meta.page}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{meta.total_pages}</span>
        {' · '}
        {meta.total} task{meta.total === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-2"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.has_prev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          className="btn-secondary px-3 py-2"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.has_next}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
