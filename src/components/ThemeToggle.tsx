import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  function toggleTheme() {
    const next: Theme = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.add("disable-theme-transitions");
    applyTheme(next);
    setTheme(next);
    // Force a reflow so the theme paints with transitions disabled, then re-enable.
    void root.offsetHeight;
    root.classList.remove("disable-theme-transitions");
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Light mode" : "Dark mode"}
    >
      {theme === "light" ? <Sun /> : <Moon />}
    </Button>
  );
}
