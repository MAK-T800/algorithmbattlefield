import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border/60 bg-card/50 hover:bg-muted/60 transition-all duration-300 text-muted-foreground hover:text-foreground"
    >
      <Sun className={`absolute w-4 h-4 transition-all duration-300 ${isDark ? "opacity-0 -rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"}`} />
      <Moon className={`absolute w-4 h-4 transition-all duration-300 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-75"}`} />
    </button>
  );
}
