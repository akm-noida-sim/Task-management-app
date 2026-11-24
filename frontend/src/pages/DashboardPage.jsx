import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  ListChecks,
  PlusCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import BarChart from '../components/BarChart';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressRing from '../components/ProgressRing';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import StatCard from '../components/StatCard';
import { useToast } from '../context/ToastContext';
import { dashboardService } from '../services/dashboardService';
import { getErrorMessage } from '../services/api';
import { dueDateLabel, isOverdue } from '../utils/formatters';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showError } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await dashboardService.stats());
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to load your dashboard.');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="card flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Loading dashboard…" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Could not load your dashboard</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <button type="button" className="btn-primary mt-5" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }

  const { overview, by_status, by_priority, by_category, recent_tasks, upcoming_deadlines } = stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="muted mt-1">A snapshot of your tasks and progress.</p>
        </div>
        <Link to="/tasks/new" className="btn-primary">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New task
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={ClipboardList} label="Total tasks" value={overview.total_tasks} tone="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={overview.completed_tasks} tone="emerald" />
        <StatCard icon={CircleDot} label="Pending" value={overview.pending_tasks} tone="amber" />
        <StatCard icon={TrendingUp} label="In progress" value={overview.in_progress_tasks} tone="sky" />
        <StatCard icon={AlertCircle} label="Overdue" value={overview.overdue_tasks} tone="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center gap-5 p-6 sm:flex-row lg:flex-col xl:flex-row">
          <ProgressRing value={overview.completion_rate} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Completion rate</h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {overview.total_tasks === 0
                ? 'Create your first task to start tracking progress.'
                : `${overview.completed_tasks} of ${overview.total_tasks} tasks completed.`}
            </p>
            <Link to="/tasks" className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
              View all tasks →
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tasks by status</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current distribution of your work</p>
          <div className="mt-6">
            <BarChart data={by_status} label="Tasks" />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tasks by priority</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Where your attention is needed</p>
          <div className="mt-6">
            <BarChart data={by_priority} label="Tasks" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent tasks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Last items you created</p>
            </div>
            <ListChecks className="h-5 w-5 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          </div>
          {recent_tasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Create a task and it will appear here."
              action={<Link to="/tasks/new" className="btn-primary">Create task</Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent_tasks.map((task) => (
                <li key={task.id}>
                  <Link to={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{task.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{task.category || 'General'}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming deadlines</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Open tasks with the nearest due dates</p>
            </div>
            <CalendarClock className="h-5 w-5 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          </div>
          {upcoming_deadlines.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming deadlines"
              description="Add due dates to your open tasks to see them here."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming_deadlines.map((task) => (
                <li key={task.id}>
                  <Link to={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{task.title}</p>
                      <p className={`mt-0.5 text-xs ${isOverdue(task) ? 'text-rose-500' : 'text-slate-400'}`}>
                        {dueDateLabel(task)}
                      </p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {by_category.length > 0 && (
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Categories</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Your most-used categories</p>
          <div className="mt-5">
            <BarChart data={by_category} label="Tasks" />
          </div>
        </div>
      )}
    </div>
  );
}
