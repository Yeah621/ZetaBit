
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { Button } from "./ui/button";

const STORAGE_KEY = "chess-analysis-theme";

export function ThemeToggle() {
  // Starts null so the server-rendered markup and the client's first render
  // match (avoiding a hydration warning); corrected to the real theme right
  // after mount. The <html> class itself is already correct from the start
  // via the blocking script in layout.tsx, so there's no visible flash.
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing or similar; the toggle still works, it just won't persist.
    }
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle} className="overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme ?? "pending"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {theme === "light" ? <Moon /> : <Sun />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
