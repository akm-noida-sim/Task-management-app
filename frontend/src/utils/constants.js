export const STATUSES = ['Pending', 'In Progress', 'Completed'];

export const PRIORITIES = ['Low', 'Medium', 'High'];

export const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
  'In Progress': 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
};

export const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-400/20',
  Medium: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
  High: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
};

export const SORT_OPTIONS = [
  { value: 'created_at', label: 'Creation date' },
  { value: 'updated_at', label: 'Last updated' },
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
];

export const EMPTY_TASK = {
  title: '',
  description: '',
  category: '',
  priority: 'Medium',
  status: 'Pending',
  start_date: '',
  due_date: '',
};
