import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../lib/utils';

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
  to?: string;
  soon?: boolean;
  className?: string;
}

export default function BentoCard({ title, description, icon, to, soon, className }: Props) {
  const body = (
    <>
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] [&_svg]:size-5">
        {icon}
      </span>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl font-medium tracking-[-0.01em]">{title}</h3>
          {soon && (
            <span className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[11px] text-[var(--ink-muted)]">
              Segera hadir
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
      </div>
    </>
  );
  const base = 'flex min-h-44 flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition';
  if (!to || soon) {
    return <div className={cn(base, soon && 'opacity-60', className)}>{body}</div>;
  }
  return (
    <Link to={to} className={cn(base, 'hover:border-[var(--accent)] hover:bg-[var(--bg-elevated-2)]', className)}>
      {body}
    </Link>
  );
}
