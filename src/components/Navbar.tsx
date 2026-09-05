import { Link } from 'react-router';

/**
 * Deliberately sparse: with only Home + one working game route so far,
 * a full nav bar would just be dead links. Grows as Fase 3+ add real
 * destinations (profile, history, ...).
 */
export default function Navbar() {
  return (
    <header className="flex items-center px-6 py-5 sm:px-10">
      <Link to="/" className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 2 4 6v5c0 5.2 3.4 9.7 8 11 4.6-1.3 8-5.8 8-11V6l-8-4Z" />
          </svg>
        </span>
        <span className="font-semibold tracking-tight text-text-primary">ZetaBit</span>
      </Link>
    </header>
  );
}
