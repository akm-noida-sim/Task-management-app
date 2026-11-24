import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import Field from './Field';
import { PRIORITIES, SORT_OPTIONS, STATUSES } from '../utils/constants';

export default function TaskFilters({ filters, onChange, categories = [], onReset }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden="true" />
        Search & filters
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="sr-only" htmlFor="task-search">
            Search tasks by title
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="task-search"
              type="search"
              className="input pl-10"
              placeholder="Search tasks by title…"
              value={filters.q}
              onChange={(event) => onChange({ q: event.target.value })}
            />
          </div>
        </div>

        <Field label="Status" htmlFor="filter-status">
          <select
            id="filter-status"
            className="input"
            value={filters.status}
            onChange={(event) => onChange({ status: event.target.value })}
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority" htmlFor="filter-priority">
          <select
            id="filter-priority"
            className="input"
            value={filters.priority}
            onChange={(event) => onChange({ priority: event.target.value })}
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category" htmlFor="filter-category">
          <input
            id="filter-category"
            className="input"
            placeholder="All categories"
            value={filters.category}
            onChange={(event) => onChange({ category: event.target.value })}
            list="task-categories"
          />
          <datalist id="task-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>

        <Field label="Sort by" htmlFor="filter-sort">
          <div className="flex gap-2">
            <select
              id="filter-sort"
              className="input"
              value={filters.sort_by}
              onChange={(event) => onChange({ sort_by: event.target.value })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="input w-28"
              aria-label="Sort order"
              value={filters.order}
              onChange={(event) => onChange({ order: event.target.value })}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </Field>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" className="btn-ghost text-xs" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset filters
        </button>
      </div>
    </div>
  );
}
