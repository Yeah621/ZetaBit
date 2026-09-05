import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';

type Accent = 'lavender' | 'peach' | 'mint';

interface BentoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  accent: Accent;
  /** Larger card, meant for the one mode that's actually playable today. */
  large?: boolean;
  /** Present but not yet wired to anything real (no backend yet). */
  comingSoon?: boolean;
  to?: string;
}

export default function BentoCard({ title, description, icon, accent, large, comingSoon, to }: BentoCardProps) {
  // Sets the --card-accent custom property the .bento-card / .bento-icon
  // CSS (index.css) reads from - keeps this a plain, static Tailwind
  // class list (accent-lavender/peach/mint would need per-value classes
  // Tailwind can't see at build time since they'd be built dynamically).
  const accentStyle = { '--card-accent': `var(--color-${accent})` } as CSSProperties;

  const content = (
    <div
      style={accentStyle}
      className={`bento-card relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 ${
        comingSoon ? '' : 'is-active active:scale-[0.99]'
      } ${large ? 'sm:p-8' : ''}`}
    >
      {comingSoon && (
        <span className="absolute right-5 top-5 rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary">
          Segera hadir
        </span>
      )}

      <div className={`bento-icon grid place-items-center rounded-2xl ${large ? 'h-12 w-12' : 'h-10 w-10'}`}>
        {icon}
      </div>

      <div className="mt-8">
        <h3 className={`font-semibold text-text-primary ${large ? 'text-2xl' : 'text-lg'}`}>{title}</h3>
        <p className={`mt-2 text-text-secondary ${large ? 'text-base' : 'text-sm'}`}>{description}</p>
      </div>
    </div>
  );

  if (comingSoon || !to) {
    return <div className="h-full cursor-default opacity-90">{content}</div>;
  }

  return (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  );
}
