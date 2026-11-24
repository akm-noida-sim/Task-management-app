import { cn } from '../utils/formatters';

const COLORS = {
  Pending: 'bg-amber-500',
  'In Progress': 'bg-sky-500',
  Completed: 'bg-emerald-500',
  Low: 'bg-slate-400',
  Medium: 'bg-indigo-500',
  High: 'bg-rose-500',
};

export default function BarChart({ data = [], label = 'Tasks' }) {
  if (!data.length) return <p className="muted">No data to display yet.</p>;
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="w-20 shrink-0 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {item.name}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn('h-full rounded-full transition-[width] duration-500', COLORS[item.name] || 'bg-brand-500')}
              style={{ width: `${(item.count / max) * 100}%` }}
              role="img"
              aria-label={`${item.name}: ${item.count} ${label.toLowerCase()}`}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
