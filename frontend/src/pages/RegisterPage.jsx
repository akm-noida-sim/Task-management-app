import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import Field from '../components/Field';
import LoadingSpinner from '../components/LoadingSpinner';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { validateRegister } from '../utils/validators';

const EMPTY = { name: '', email: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setApiError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validateRegister(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      showSuccess('Account created. Welcome to TaskFlow!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setApiError(getErrorMessage(error, 'Unable to create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Start organising your work in under a minute.</p>

          <form onSubmit={submit} noValidate className="mt-7 space-y-5">
            {apiError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300" role="alert">
                {apiError}
              </div>
            )}

            <Field label="Full name" htmlFor="name" error={errors.name}>
              <input
                id="name"
                name="name"
                autoComplete="name"
                className="input"
                placeholder="Ada Lovelace"
                value={values.name}
                onChange={change}
                aria-invalid={Boolean(errors.name)}
              />
            </Field>

            <Field label="Email address" htmlFor="email" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
                value={values.email}
                onChange={change}
                aria-invalid={Boolean(errors.email)}
              />
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pr-11"
                  placeholder="Create a strong password"
                  value={values.password}
                  onChange={change}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input"
                placeholder="Repeat your password"
                value={values.confirmPassword}
                onChange={change}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
            </Field>

            <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
              {submitting ? <LoadingSpinner label="Creating account…" small /> : <><UserPlus className="h-4 w-4" aria-hidden="true" /> Create account</>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
