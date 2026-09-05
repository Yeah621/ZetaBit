import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  /** Text color class applied to the button (and, through currentColor,
   * to the inactive icon + the track's OFF state). Defaults to the
   * theme-adaptive secondary token. Pass the hero's own on-dark token
   * when mounting inside Home's hero band, which stays dark regardless
   * of the site theme - see Navbar.tsx. */
  mutedClassName?: string;
}

/**
 * Sun / pill / moon control - the reference's own toggle-pill idea,
 * wired to real state instead of a manual classList script. See
 * index.css's "Theme toggle" section for why the track color works in
 * both the hero and theme-adaptive contexts without a variant prop.
 */
export default function ThemeToggle({ mutedClassName = 'text-text-secondary' }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      className={`theme-toggle inline-flex items-center gap-2 ${mutedClassName}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3.5 w-3.5 ${isDark ? '' : 'text-accent'}`}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v1.5M12 19.5V21M4.6 4.6l1.1 1.1M18.3 18.3l1.1 1.1M3 12h1.5M19.5 12H21M4.6 19.4l1.1-1.1M18.3 5.7l1.1-1.1" />
      </svg>

      <span className="theme-toggle-track" data-state={theme} aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>

      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`h-3.5 w-3.5 ${isDark ? 'text-accent' : ''}`}
        aria-hidden="true"
      >
        <path d="M20.7 14.9A8.5 8.5 0 0 1 9.1 3.3a8.9 8.9 0 1 0 11.6 11.6Z" />
      </svg>
    </button>
  );
}
