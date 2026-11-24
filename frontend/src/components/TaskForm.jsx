import { useState } from 'react';
import Field from './Field';
import { EMPTY_TASK, PRIORITIES, STATUSES } from '../utils/constants';
import { validateTask } from '../utils/validators';
import LoadingSpinner from './LoadingSpinner';

export default function TaskForm({
  initialValues = EMPTY_TASK,
  submitLabel = 'Create task',
  onSubmit,
  onCancel,
  apiError = '',
}) {
  const [values, setValues] = useState({ ...EMPTY_TASK, ...initialValues });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validateTask(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category.trim() || 'General',
        priority: values.priority,
        status: values.status,
        start_date: values.start_date || null,
        due_date: values.due_date,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {apiError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300" role="alert">
          {apiError}
        </div>
      )}

      <div>
        <Field label="Task title" htmlFor="title" error={errors.title}>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="e.g. Prepare quarterly report"
            value={values.title}
            onChange={change}
            aria-invalid={Boolean(errors.title)}
            maxLength={120}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" error={errors.description} hint="Optional – add context, links or acceptance criteria.">
        <textarea
          id="description"
          name="description"
          rows={4}
          className="input resize-y"
          placeholder="What needs to be done?"
          value={values.description}
          onChange={change}
          maxLength={2000}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="category" error={errors.category}>
          <input
            id="category"
            name="category"
            className="input"
            placeholder="Work, Personal, Studies…"
            value={values.category}
            onChange={change}
            maxLength={60}
          />
        </Field>

        <Field label="Priority" htmlFor="priority" error={errors.priority}>
          <select id="priority" name="priority" className="input" value={values.priority} onChange={change}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="status" error={errors.status}>
          <select id="status" name="status" className="input" value={values.status} onChange={change}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Start date" htmlFor="start_date" error={errors.start_date} hint="Optional">
          <input
            id="start_date"
            name="start_date"
            type="date"
            className="input"
            value={values.start_date || ''}
            onChange={change}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Due date" htmlFor="due_date" error={errors.due_date}>
            <input
              id="due_date"
              name="due_date"
              type="date"
              className="input"
              value={values.due_date || ''}
              onChange={change}
              aria-invalid={Boolean(errors.due_date)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <LoadingSpinner label="Saving…" small /> : submitLabel}
        </button>
      </div>
    </form>
  );
}
