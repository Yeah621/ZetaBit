import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function AppMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d="M12 2 20 7 V17 L12 22 4 17 V7Z" fill="none" stroke="var(--accent)" strokeWidth={1.6} />
      <path d="M12 7.4 15.6 9.5 V14 L12 16.6 8.4 14 V9.5Z" fill="var(--accent)" />
    </svg>
  );
}

/** Header yang sama dengan Ply: mark + wordmark display di kiri, aksi di kanan. */
export function AppHeader({ name = 'Ply', subtitle, actions }: { name?: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <AppMark />
        <div className="flex flex-col leading-none">
          <span className="font-display text-lg font-medium tracking-[-0.01em]">{name}</span>
          {subtitle && <span className="mt-0.5 text-xs text-[var(--ink-muted)]">{subtitle}</span>}
        </div>
      </Link>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
