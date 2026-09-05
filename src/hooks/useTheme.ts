import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/** Same key the inline script in index.html reads before React ever
 * mounts - keep these in sync, or the very first toggle after load will
 * visibly "jump" instead of just flipping. */
const STORAGE_KEY = 'zetabit-theme';

function getSystemPreference(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage can throw in locked-down embeds/private browsing -
    // fall through to the system preference instead of crashing the app.
  }
  return getSystemPreference();
}

/**
 * Light/dark theme, backed by a `dark` class on `<html>` (every
 * `.dark { ... }` override in index.css reads it) and persisted to
 * localStorage. The inline script in index.html applies the same class
 * synchronously on first paint, before this ever runs, so returning
 * dark-mode users don't get a flash of the light theme.
 *
 * Deliberately just component-local state, not a Context/store: Home's
 * Navbar and Game's TopBar are the only two consumers today and they
 * live on different routes, so exactly one is ever mounted at a time -
 * a shared store would be solving a problem this app doesn't have yet.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Best-effort persistence only - theme still works for this tab.
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
