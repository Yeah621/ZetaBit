import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface BentoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  /** Larger card, meant for the one mode that's actually playable today. */
  large?: boolean;
  /** Present but not yet wired to anything real (no backend yet). */
  comingSoon?: boolean;
  to?: string;
}

export default function BentoCard({ title, description, icon, large, comingSoon, to }: BentoCardProps) {
  const content = (
    <div
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-bg-raised p-6 transition-colors ${
        comingSoon ? '' : 'hover:border-accent-dim active:scale-[0.99]'
      } ${large ? 'sm:p-8' : ''}`}
    >
      {comingSoon && (
        <span className="absolute right-5 top-5 rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary">
          Segera hadir
        </span>
      )}

      <div
        className={`grid place-items-center rounded-xl bg-accent/10 text-accent ${
          large ? 'h-12 w-12' : 'h-10 w-10'
        }`}
      >
        {icon}
      </div>

      <div className="mt-8">
        <h3 className={`font-semibold text-text-primary ${large ? 'text-2xl' : 'text-lg'}`}>{title}</h3>
        <p className={`mt-2 text-text-secondary ${large ? 'text-base' : 'text-sm'}`}>{description}</p>
      </div>
    </div>
  );

  if (comingSoon || !to) {
    return <div className="h-full cursor-default opacity-80">{content}</div>;
  }

  return (
    <Link to={to} className="block h-full transition-transform duration-200 ease-out">
      {content}
    </Link>
  );
}
