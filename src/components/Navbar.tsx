import logo from "@/assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { Users, Swords, Eye, Trophy, BookOpen } from "lucide-react";

const navItems = [
  { to: "/", icon: Users, label: "Rooms" },
  { to: "/visualize", icon: Eye, label: "Visualize" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-strong rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Platform" className="h-10" />
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to || (item.to === "/" && location.pathname.startsWith("/quiz"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/15 text-primary neon-glow-blue"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
