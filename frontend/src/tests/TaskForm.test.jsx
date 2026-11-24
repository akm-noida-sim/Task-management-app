import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '../components/TaskForm';

describe('TaskForm', () => {
  it('blocks submission and shows validation messages for empty fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /create task/i }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Due date is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a normalised payload after valid input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/task title/i), '  Prepare report  ');
    await user.type(screen.getByLabelText(/description/i), 'Include charts');
    await user.type(screen.getByLabelText(/category/i), '  Work ');
    await user.selectOptions(screen.getByLabelText(/priority/i), 'High');
    await user.type(screen.getByLabelText(/due date/i), '2026-12-31');
    await user.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prepare report',
        category: 'Work',
        priority: 'High',
        due_date: '2026-12-31',
      }),
    );
  });
});
