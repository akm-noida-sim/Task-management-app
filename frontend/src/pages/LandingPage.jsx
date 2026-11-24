import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Filter,
  ListTodo,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ListTodo,
    title: 'Complete task control',
    text: 'Create, organise, prioritise and update tasks with a focused, distraction-free interface.',
  },
  {
    icon: BarChart3,
    title: 'Insights that matter',
    text: 'A live dashboard shows progress, overdue work and upcoming deadlines at a glance.',
  },
  {
    icon: Filter,
    title: 'Find anything fast',
    text: 'Search by title and filter by status, priority or category. Sort exactly how you prefer.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'JWT authentication, hashed passwords and per-user data isolation keep your work yours.',
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,70,229,0.14),transparent)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Your work, clearly organised
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Do your best work, <span className="text-brand-600 dark:text-brand-400">one task at a time.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              TaskFlow brings your tasks, deadlines and priorities into one clean workspace. Plan the day,
              track progress and finish with confidence — on any device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">
                Start for free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn-secondary px-6 py-3 text-base">
                Log in
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> No credit card
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Works on mobile
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Light & dark mode
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="card rotate-1 p-5 shadow-xl transition hover:rotate-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Today&apos;s focus</p>
                  <p className="text-xs text-slate-500">A preview of your workspace</p>
                </div>
                <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  3 items
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { title: 'Finalise project brief', tag: 'High', done: true },
                  { title: 'Review pull requests', tag: 'Medium', done: false },
                  { title: 'Plan next sprint', tag: 'Low', done: false },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        item.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {item.done && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                    <span className={`flex-1 text-sm ${item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                      {item.title}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{item.tag}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Progress updates automatically as you complete tasks.
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:block dark:border-slate-700 dark:bg-slate-900">
              <CalendarClock className="mb-1 h-4 w-4 text-brand-600" aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Never miss a deadline</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Everything you need to stay organised
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Thoughtful features that help you move from a scattered to-do list to a clear plan of action.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="card flex flex-col items-center justify-between gap-6 bg-gradient-to-br from-brand-600 to-indigo-700 p-8 text-white sm:flex-row sm:p-10">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to take control of your day?</h2>
            <p className="mt-2 text-brand-100">Create your free account and set up your first workspace in minutes.</p>
          </div>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-50">
            Create your account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
