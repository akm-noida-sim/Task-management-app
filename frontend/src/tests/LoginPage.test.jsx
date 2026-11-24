import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn().mockResolvedValue({ id: '1', name: 'Ada', email: 'ada@example.com' }),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

import { authService } from '../services/authService';

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('shows validation errors without calling the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials', async () => {
    authService.login.mockResolvedValueOnce({
      user: { id: '1', name: 'Ada', email: 'ada@example.com' },
      access_token: 'test-token',
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'correcthorse');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'correcthorse',
      }),
    );
    expect(localStorage.getItem('taskflow.token')).toBe('test-token');
  });
});
