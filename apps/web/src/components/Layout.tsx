import { Activity, BarChart3, Moon, WandSparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/log", label: "Log", icon: Activity },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/simulation", label: "Simulation", icon: WandSparkles }
];

export function Layout() {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#202124]">
      <header className="border-b border-[#dfe3ea] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#202124] text-white">
              <Moon size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">Shadow Self</p>
              <p className="text-sm text-[#626976]">habit projection</p>
            </div>
          </div>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition",
                      isActive
                        ? "border-[#534AB7] bg-[#eeedf9] text-[#534AB7]"
                        : "border-[#dfe3ea] bg-white text-[#4b515c] hover:border-[#bfc6d4]"
                    ].join(" ")
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
