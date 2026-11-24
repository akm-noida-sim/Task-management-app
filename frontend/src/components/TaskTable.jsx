import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './Badges';
import { cn, dueDateLabel, isOverdue } from '../utils/formatters';

export default function TaskTable({ tasks, onDelete, onStatusChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-5 py-3 font-semibold">Task</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Priority</th>
            <th className="px-5 py-3 font-semibold">Due date</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <tr key={task.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-5 py-4">
                  <Link to={`/tasks/${task.id}`} className="font-semibold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                    {task.title}
                  </Link>
                  <p className="mt-1 max-w-md truncate text-xs text-slate-500 dark:text-slate-400">
                    {task.category || 'General'}
                    {task.description ? ` · ${task.description}` : ''}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <select
                    className="input w-36 px-2 py-1.5 text-xs"
                    aria-label={`Change status of ${task.title}`}
                    value={task.status}
                    onChange={(event) => onStatusChange?.(task, event.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <div className="mt-1.5 lg:hidden">
                    <StatusBadge status={task.status} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className={cn('px-5 py-4 text-xs font-medium', overdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300')}>
                  {dueDateLabel(task)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
