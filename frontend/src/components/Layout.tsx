import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ListTodo, Cpu, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--color-border)]">
          <div className="h-7 w-7 rounded-md bg-[var(--color-ink)] flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-sm bg-[var(--color-accent-soft)]" />
          </div>
          <span className="font-[var(--font-display)] font-semibold tracking-tight">Loom</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem to="/" icon={<LayoutGrid className="h-4 w-4" />} label="Queues" active={location.pathname === '/'} />
          <NavItem to="/jobs" icon={<ListTodo className="h-4 w-4" />} label="Jobs" active={location.pathname === '/jobs'} />
          <NavItem to="/workers" icon={<Cpu className="h-4 w-4" />} label="Workers" active={location.pathname === '/workers'} />
        </nav>

        <div className="px-3 py-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
            <div className="h-7 w-7 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-xs font-medium text-[var(--color-accent)]">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-[var(--color-muted)] truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({ to, icon, label, active }: { to: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-[var(--color-ink)] text-white'
          : 'text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
