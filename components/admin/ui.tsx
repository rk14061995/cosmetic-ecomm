import type { ReactNode } from 'react';

export function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

/** Primary content stack inside the admin shell. */
export const adminStack = 'space-y-8';

/** Raised surface (tables, filters, forms). */
export const adminPanel =
  'rounded-xl border border-indigo-200/50 bg-white/85 shadow-[0_2px_8px_rgba(49,46,129,0.06)] backdrop-blur-sm';

export const adminTableHead =
  'text-left text-[11px] font-semibold uppercase tracking-wider text-indigo-950/55 bg-indigo-100/60 border-b border-indigo-200/70';

export const adminInput =
  'w-full rounded-lg border border-indigo-200/60 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export const adminLabel = 'mb-1 block text-xs font-medium text-indigo-950/65';

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-indigo-950 shadow-sm transition hover:bg-indigo-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 disabled:opacity-50';

export const btnAccent =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:opacity-50';

export const btnSuccess =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50';

export function filterPill(active: boolean) {
  return cx(
    'rounded-lg px-3 py-1.5 text-xs font-medium transition',
    active
      ? 'bg-indigo-950 text-white shadow-sm'
      : 'border border-indigo-200/70 bg-white/80 text-indigo-950/70 hover:border-indigo-300 hover:bg-indigo-50/70',
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
  eyebrow = 'Administration',
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-indigo-200/50 pb-8 sm:flex-row sm:items-end">
      <div className="min-w-0 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600/80">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-indigo-950 sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-relaxed text-indigo-950/55">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminModal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'w-full rounded-xl border border-indigo-200/60 bg-white/95 p-6 shadow-2xl shadow-indigo-950/15 backdrop-blur-md',
        className,
      )}
    >
      {children}
    </div>
  );
}
