import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Compass className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mt-8 text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">This page went off the map</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist or has been moved. Let&apos;s get you back to something useful.
        </p>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="btn-primary mt-8">
          <Home className="h-4 w-4" aria-hidden="true" />
          {isAuthenticated ? 'Go to dashboard' : 'Back to home'}
        </Link>
      </div>
    </div>
  );
}
