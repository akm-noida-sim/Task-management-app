import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TaskForm from '../components/TaskForm';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { taskService } from '../services/taskService';

export default function CreateTaskPage() {
  const [apiError, setApiError] = useState('');
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const submit = async (payload) => {
    setApiError('');
    try {
      await taskService.create(payload);
      showSuccess('Task created successfully.');
      navigate('/tasks', { replace: true });
    } catch (error) {
      setApiError(getErrorMessage(error, 'Unable to create the task.'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/tasks" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to tasks
        </Link>
        <h1 className="page-title mt-3">Create a task</h1>
        <p className="muted mt-1">Add the details and set a deadline. You can change them later.</p>
      </div>
      <div className="card p-6 sm:p-8">
        <TaskForm onSubmit={submit} onCancel={() => navigate('/tasks')} apiError={apiError} submitLabel="Create task" />
      </div>
    </div>
  );
}
