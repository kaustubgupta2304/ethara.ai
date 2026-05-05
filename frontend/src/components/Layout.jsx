import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const navClass = ({ isActive }) =>
  [
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
      : "text-slate-600 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800",
  ].join(" ");

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              Team<span className="text-brand-600">Task</span>
            </NavLink>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" className={navClass} end>
                Dashboard
              </NavLink>
              <NavLink to="/projects" className={navClass}>
                Projects
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium text-slate-900 dark:text-white">{user?.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin ? "Administrator" : "Member"}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              Log out
            </button>
          </div>
        </div>
        <div className="flex gap-1 border-t border-slate-100 px-4 py-2 sm:hidden dark:border-slate-800">
          <NavLink to="/" className={navClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={navClass}>
            Projects
          </NavLink>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
