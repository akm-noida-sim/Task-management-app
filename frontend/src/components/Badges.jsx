import { cn } from '../utils/formatters';
import { PRIORITY_STYLES, STATUS_STYLES } from '../utils/constants';

export function StatusBadge({ status }) {
  return (
    <span className={cn('badge ring-1 ring-inset', STATUS_STYLES[status] || STATUS_STYLES.Pending)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={cn('badge ring-1 ring-inset', PRIORITY_STYLES[priority] || PRIORITY_STYLES.Low)}>
      {priority}
    </span>
  );
}
