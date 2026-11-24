import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { isAuthenticated, loading, sessionError, retry } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner label="Checking your session" />
      </div>
    );
  }

  if (sessionError && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="card w-full max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            Could not verify your session
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{sessionError}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={retry}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
            <Link to="/login" className="btn-secondary">
              Log in again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
