export function cn(...values) {
  return values.filter(Boolean).join(' ');
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(task) {
  if (!task?.due_date || task.status === 'Completed') return false;
  return String(task.due_date).slice(0, 10) < todayISO();
}

export function daysUntil(value) {
  if (!value) return null;
  const due = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  const today = new Date(`${todayISO()}T00:00:00`);
  return Math.round((due - today) / 86400000);
}

export function dueDateLabel(task) {
  if (!task?.due_date) return 'No due date';
  const days = daysUntil(task.due_date);
  if (task.status === 'Completed') return formatDate(task.due_date);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export function initials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
