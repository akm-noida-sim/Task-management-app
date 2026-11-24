import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import TaskForm from '../components/TaskForm';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { taskService } from '../services/taskService';

export default function EditTaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    taskService
      .get(id)
      .then((result) => {
        if (active) setTask(result);
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error, 'Unable to load this task.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const submit = async (payload) => {
    setApiError('');
    try {
      await taskService.update(id, payload);
      showSuccess('Task updated successfully.');
      navigate(`/tasks/${id}`, { replace: true });
    } catch (error) {
      setApiError(getErrorMessage(error, 'Unable to update the task.'));
    }
  };

  if (loading) {
    return (
      <div className="card flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading task…" />
      </div>
    );
  }

  if (loadError || !task) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Task unavailable</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
          </button>
          <Link to="/tasks" className="btn-primary">Back to tasks</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={`/tasks/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to task
        </Link>
        <h1 className="page-title mt-3">Edit task</h1>
        <p className="muted mt-1">Update the details below and save your changes.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <TaskForm
          initialValues={task}
          onSubmit={submit}
          onCancel={() => navigate(`/tasks/${id}`)}
          apiError={apiError}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
