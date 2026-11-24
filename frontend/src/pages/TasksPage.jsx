import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, PlusCircle, RefreshCw, SearchX } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import TaskFormModal from '../components/TaskFormModal';
import TaskTable from '../components/TaskTable';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { useTasks } from '../hooks/useTasks';
import { getErrorMessage } from '../services/api';
import { taskService } from '../services/taskService';

const DEFAULT_FILTERS = {
  q: '',
  status: '',
  priority: '',
  category: '',
  sort_by: 'created_at',
  order: 'desc',
  page: 1,
  limit: 10,
};

export default function TasksPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.q, 300);
  const params = useMemo(() => ({ ...filters, q: debouncedSearch }), [filters, debouncedSearch]);
  const { tasks, meta, loading, error, refresh } = useTasks(params);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  const updateFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  };

  const handleCreate = async (payload) => {
    setCreateError('');
    try {
      await taskService.create(payload);
      setCreateOpen(false);
      setFilters(DEFAULT_FILTERS);
      refresh();
      showSuccess('Task created successfully.');
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Unable to create the task.'));
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await taskService.remove(taskToDelete.id);
      showSuccess('Task deleted.');
      setTaskToDelete(null);
      refresh();
    } catch (err) {
      showError(getErrorMessage(err, 'Unable to delete the task.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    if (task.status === status) return;
    try {
      await taskService.updateStatus(task.id, status);
      showSuccess(`Marked as ${status.toLowerCase()}.`);
      refresh();
    } catch (err) {
      showError(getErrorMessage(err, 'Unable to update the task status.'));
    }
  };

  const categories = useMemo(
    () => [...new Set(tasks.map((task) => task.category).filter(Boolean))],
    [tasks],
  );
  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.priority || filters.category,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">All tasks</h1>
          <p className="muted mt-1">
            {meta ? `${meta.total} task${meta.total === 1 ? '' : 's'} in your workspace` : 'Manage everything in one place'}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setCreateError(''); setCreateOpen(true); }}>
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New task
        </button>
      </div>

      <TaskFilters
        filters={filters}
        onChange={updateFilters}
        categories={categories}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {error && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-rose-200 p-4 text-sm text-rose-700 dark:border-rose-900 dark:text-rose-300">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
          </span>
          <button type="button" className="btn-secondary px-3 py-1.5" onClick={refresh}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner label="Loading tasks…" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={hasActiveFilters ? SearchX : undefined}
            title={hasActiveFilters ? 'No matching tasks' : 'No tasks yet'}
            description={
              hasActiveFilters
                ? 'Try a different search term or reset your filters.'
                : 'Create your first task to get started.'
            }
            action={
              hasActiveFilters ? (
                <button type="button" className="btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Reset filters
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
                  Create task
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:block">
            <TaskTable tasks={tasks} onDelete={setTaskToDelete} onStatusChange={handleStatusChange} />
          </div>
          <div className="grid gap-4 p-4 md:hidden">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={setTaskToDelete} />
            ))}
          </div>
          <Pagination meta={meta} onPageChange={(page) => updateFilters({ page })} />
        </div>
      )}

      {tasks.length > 0 && !loading && (
        <p className="text-center text-xs text-slate-400">
          Tip: use the status dropdown in the table to update a task without opening it.{' '}
          <Link to="/dashboard" className="text-brand-600 hover:underline dark:text-brand-400">View dashboard</Link>
        </p>
      )}

      <TaskFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        apiError={createError}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this task?"
        message={`“${taskToDelete?.title || ''}” will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete task"
      />
    </div>
  );
}
