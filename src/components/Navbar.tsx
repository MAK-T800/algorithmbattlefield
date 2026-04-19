import { useState } from "react";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import { Link, useLocation } from "react-router-dom";
import { Users, Eye, Trophy, Menu, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/", icon: Users, label: "Rooms" },
  { to: "/visualize", icon: Eye, label: "Visualize" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
];

export default function Navbar() {
  const location = useLocation();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const logo = theme === "dark" ? logoDark : logoLight;

  const isActive = (to: string) =>
    location.pathname === to || (to === "/" && location.pathname.startsWith("/quiz"));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-strong rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center">
          <img
            src={logo}
            alt="Logo"
            className="h-9 sm:h-10 transition-all duration-300 hover:scale-105 drop-shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border/60 bg-card/50 text-foreground"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
