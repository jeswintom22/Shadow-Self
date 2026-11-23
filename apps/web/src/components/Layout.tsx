import { Activity, BarChart3, Moon, MoonStar, Settings, Sun, WandSparkles } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getTheme, setTheme, type Theme } from "../lib/theme.js";

const navItems = [
  { to: "/log", label: "Log", icon: Activity },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/simulation", label: "Simulation", icon: WandSparkles },
  { to: "/settings", label: "Settings", icon: Settings }
];

function navLinkClass(isActive: boolean, base: string): string {
  return [
    base,
    "transition",
    isActive ? "border-accent bg-accent-soft text-accent" : "border-line bg-card text-soft hover:border-line-strong"
  ].join(" ");
}

export function Layout() {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const ThemeIcon = theme === "dark" ? Sun : MoonStar;

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-card">
                <Moon size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-semibold leading-tight">Shadow Self</p>
                <p className="text-sm text-muted">habit projection</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-card text-soft transition hover:border-line-strong sm:hidden"
            >
              <ThemeIcon size={17} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Primary navigation" className="hidden flex-wrap items-center gap-2 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    navLinkClass(isActive, "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium")
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-card text-soft transition hover:border-line-strong"
            >
              <ThemeIcon size={17} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:pb-10">
        <Outlet />
        <footer className="mt-10 border-t border-line-soft pt-4 text-xs leading-5 text-muted">
          Shadow Self is a habit-awareness toy, not medical or mental-health advice. Your logs stay in this
          browser — nothing is uploaded.
        </footer>
      </main>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card sm:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition",
                    isActive ? "text-accent" : "text-muted"
                  ].join(" ")
                }
              >
                <Icon size={19} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
