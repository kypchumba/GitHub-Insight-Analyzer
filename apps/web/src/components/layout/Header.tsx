import { Github, Moon, Sun } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../ui/button";

interface HeaderProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export function Header({ theme, onThemeChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <Github className="h-5 w-5" />
          </span>
          <span className="truncate text-sm font-semibold sm:text-base">GitHub Insight Analyzer</span>
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hidden rounded-md px-3 py-2 text-sm font-medium transition sm:inline-flex ${
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`
            }
          >
            Search
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}

