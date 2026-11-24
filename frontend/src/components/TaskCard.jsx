import { Link } from 'react-router-dom';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './Badges';
import { cn, dueDateLabel, formatDate, isOverdue } from '../utils/formatters';

export default function TaskCard({ task, onDelete }) {
  const overdue = isOverdue(task);

  return (
    <article className="card flex h-full flex-col p-5 transition hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {task.category || 'General'}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900 dark:text-white">
        <Link to={`/tasks/${task.id}`} className="hover:text-brand-600 dark:hover:text-brand-400">
          {task.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {task.description || 'No description provided.'}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium',
            overdue
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400',
          )}
          title={formatDate(task.due_date)}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {dueDateLabel(task)}
        </span>
        <div className="flex items-center gap-1">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800 dark:hover:text-brand-400"
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete?.(task)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
