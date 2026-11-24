import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { taskService } from '../services/taskService';
import { STATUSES } from '../utils/constants';
import { formatDate, formatDateTime, isOverdue } from '../utils/formatters';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTask(await taskService.get(id));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this task.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatus = async (event) => {
    const status = event.target.value;
    try {
      const updated = await taskService.updateStatus(id, status);
      setTask(updated);
      showSuccess(`Marked as ${status.toLowerCase()}.`);
    } catch (err) {
      showError(getErrorMessage(err, 'Unable to update status.'));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await taskService.remove(id);
      showSuccess('Task deleted.');
      navigate('/tasks', { replace: true });
    } catch (err) {
      showError(getErrorMessage(err, 'Unable to delete the task.'));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading task…" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Task unavailable</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" className="btn-secondary" onClick={load}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
          </button>
          <Link to="/tasks" className="btn-primary">Back to tasks</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/tasks" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to tasks
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{task.category}</span>
          </div>
          <h1 className="page-title mt-3">{task.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/tasks/${task.id}/edit`} className="btn-secondary">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
          </Link>
          <button type="button" className="btn-danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {task.description || 'No description provided.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            {task.status !== 'Completed' ? (
              <button type="button" className="btn-primary" onClick={() => handleStatus({ target: { value: 'Completed' } })}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Mark as completed
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Completed
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Task details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                <dd className="mt-1">
                  <select className="input py-2" value={task.status} onChange={handleStatus} aria-label="Task status">
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Start date</dt>
                <dd className="mt-1 text-slate-700 dark:text-slate-200">{formatDate(task.start_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</dt>
                <dd className={`mt-1 font-medium ${isOverdue(task) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {formatDate(task.due_date)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Timeline</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Created {formatDateTime(task.created_at)}
              </li>
              <li className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Updated {formatDateTime(task.updated_at)}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this task?"
        message={`“${task.title}” will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete task"
      />
    </div>
  );
}
