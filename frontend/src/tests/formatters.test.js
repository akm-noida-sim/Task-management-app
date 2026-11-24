import { describe, expect, it } from 'vitest';
import {
  cn,
  daysUntil,
  dueDateLabel,
  formatDate,
  initials,
  isOverdue,
  todayISO,
} from '../utils/formatters';

describe('formatters', () => {
  it('formats ISO dates without timezone shifts', () => {
    expect(formatDate('2026-01-05')).toBe('Jan 5, 2026');
    expect(formatDate(null)).toBe('—');
  });

  it('builds initials from a full name', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('')).toBe('');
  });

  it('joins conditional class names', () => {
    expect(cn('a', false, 'b', undefined, 'c')).toBe('a b c');
  });

  it('detects overdue tasks and ignores completed ones', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    expect(isOverdue({ due_date: yesterday, status: 'Pending' })).toBe(true);
    expect(isOverdue({ due_date: yesterday, status: 'Completed' })).toBe(false);
    expect(isOverdue({ due_date: todayISO(), status: 'Pending' })).toBe(false);
  });

  it('describes upcoming deadlines in human-readable form', () => {
    expect(daysUntil(todayISO())).toBe(0);
    expect(dueDateLabel({ due_date: todayISO(), status: 'Pending' })).toBe('Due today');
    expect(dueDateLabel({ due_date: null, status: 'Pending' })).toBe('No due date');
  });
});
