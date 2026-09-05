import { Link } from 'react-router';
import ThemeToggle from './ThemeToggle';

interface TopBarProps {
  /** Route the back button returns to. */
  backTo: string;
  /** Label shown next to the back arrow. */
  backLabel: string;
}

/**
 * Header for content pages other than Home (today: just /local). Unlike
 * `Navbar` - which lives inside Home's permanently-dark hero and is
 * styled for that fixed backdrop - this adapts to the light/dark toggle
 * via theme tokens, since the pages it sits on do too. Not sticky: see
 * the `.topbar-glass` comment in index.css.
 */
export default function TopBar({ backTo, backLabel }: TopBarProps) {
  return (
    <header className="topbar-glass relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
      <Link
        to={backTo}
        className="back-pill group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {backLabel}
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/" className="hidden items-center gap-2 sm:flex">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M12 2 4 6v5c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V6l-8-4Z" />
            </svg>
          </span>
          <span className="font-heading text-sm font-semibold tracking-tight text-text-primary">
            ZetaBit
          </span>
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
