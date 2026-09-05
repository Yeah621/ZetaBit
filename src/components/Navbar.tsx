import { Link } from 'react-router';
import ThemeToggle from './ThemeToggle';

/**
 * Lives inside the dark hero-band on Home, so it's styled for a dark
 * background specifically. Sticky + glass so it still reads as
 * intentional once the page scrolls under it, not just a static strip.
 */
export default function Navbar() {
  return (
    <header className="nav-glass flex items-center justify-between px-6 py-4 sm:px-10">
      <Link to="/" className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-md bg-accent/20 text-accent"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 2 4 6v5c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V6l-8-4Z" />
          </svg>
        </span>
        <span className="font-heading font-semibold tracking-tight text-text-on-dark">ZetaBit</span>
      </Link>

      {/* mutedClassName override: this navbar's backdrop is always the
          dark hero, in both site themes, so the toggle's inactive icon
          needs the hero's own on-dark token, not the theme-adaptive one
          ThemeToggle defaults to (see its own doc comment). */}
      <ThemeToggle mutedClassName="text-text-on-dark-secondary" />
    </header>
  );
}
