import { ShieldCheck } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { SkeletonTable } from '../../../shared/design-system/Skeleton';
import { EMPTY } from '../../../shared/ui/emptyStatePresets';

export function AdminPageShell({ title, subtitle, children, actions, icon: Icon = ShieldCheck }) {
  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-2 py-4 sm:px-4 sm:py-6">
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-emerald-100/50 blur-2xl"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-600" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3.5">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md sm:flex">
              <Icon size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                অ্যাডমিন প্যানেল
              </p>
              <h1 className="mt-0.5 truncate text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>

      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = 'emerald', icon: Icon }) {
  const accents = {
    emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    blue: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
    amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    violet: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
    slate: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white',
  };
  const iconTones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md',
        accents[accent] || accents.emerald
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              iconTones[accent] || iconTones.emerald
            )}
          >
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export function Badge({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
        className
      )}
    >
      {children}
    </span>
  );
}

export function TableShell({ headers, children, empty, loading, emptyPreset = 'admin' }) {
  if (loading) return <SkeletonTable rows={6} cols={headers.length} />;
  if (empty) return EMPTY[emptyPreset]?.() ?? EMPTY.admin();
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'নিশ্চিত', danger }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 id="confirm-modal-title" className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              danger ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500' : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
