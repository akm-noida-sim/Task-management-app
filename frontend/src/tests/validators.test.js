import { describe, expect, it } from 'vitest';
import {
  validateLogin,
  validatePasswordChange,
  validateProfile,
  validateRegister,
  validateTask,
} from '../utils/validators';

describe('client-side validators', () => {
  it('requires a title and due date for tasks', () => {
    const errors = validateTask({ title: '', due_date: '', priority: 'High', status: 'Pending' });
    expect(errors.title).toBeTruthy();
    expect(errors.due_date).toBeTruthy();
  });

  it('rejects a due date before the start date', () => {
    const errors = validateTask({
      title: 'Plan',
      start_date: '2026-10-10',
      due_date: '2026-01-01',
      priority: 'Low',
      status: 'Pending',
    });
    expect(errors.due_date).toMatch(/before/i);
  });

  it('accepts a valid task', () => {
    expect(
      validateTask({ title: 'Plan', due_date: '2026-12-31', priority: 'Low', status: 'Pending' }),
    ).toEqual({});
  });

  it('validates registration password confirmation', () => {
    const errors = validateRegister({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'longpassword1',
      confirmPassword: 'different',
    });
    expect(errors.confirmPassword).toBeTruthy();
  });

  it('validates login, profile and password forms', () => {
    expect(validateLogin({ email: 'bad', password: '' })).toHaveProperty('email');
    expect(validateProfile({ name: 'A', email: 'bad' })).toHaveProperty('email');
    expect(
      validatePasswordChange({
        current_password: 'oldpassword',
        new_password: 'newpassword',
        confirm_password: 'nomatch',
      }),
    ).toHaveProperty('confirm_password');
  });
});
