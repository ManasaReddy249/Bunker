import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell, LayoutDashboard, Ship, Fuel, ClipboardList, Warehouse, LineChart,
  CheckSquare, FileBarChart, Users, Settings, Search, LogOut, Anchor
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMemo, useState } from 'react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { to: '/vendors', label: 'Historical Vendors', icon: Fuel, roles: ['Administrator', 'Executive'] },
  { to: '/requests', label: 'Fuel Requests', icon: ClipboardList, roles: ['Administrator', 'Executive'] },
  { to: '/ships', label: 'Ships', icon: Ship, roles: ['Administrator', 'Executive'] },
  { to: '/workspace', label: 'Operations Workspace', icon: Warehouse, roles: ['Administrator', 'Executive'] },
  { to: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['Administrator'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['Administrator'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['User Administrator'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['User Administrator'] }
];

export default function AppLayout() {
  const { user, demoMode, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const items = useMemo(() => NAV.filter((i) => !i.roles || i.roles.includes(user?.role)), [user]);

  function search(e) {
    e.preventDefault();
    const value = q.trim().toLowerCase();
    if (!value) return;
    if (value.includes('vendor')) navigate('/vendors');
    else if (value.includes('ship')) navigate('/ships');
    else if (value.includes('request')) navigate('/requests');
    else if (value.includes('inventory')) navigate('/inventory');
    else navigate('/ships');
  }

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="sidebar-shell hidden w-64 shrink-0 flex-col text-white md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="sidebar-brand-mark flex h-10 w-10 items-center justify-center rounded-lg text-white">
            <Anchor size={20} />
          </div>
          <div>
            <div className="font-semibold">BunkerSmart</div>
            <div className="text-xs text-white/60">Fuel Management System</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'sidebar-link-active' : 'text-white/70 hover:bg-white/8 hover:text-white'}`}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="page-topline flex items-center justify-between gap-4 border-b bg-white/90 px-5 py-3 backdrop-blur">
          <form onSubmit={search} className="relative max-w-xl flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="input pl-9" placeholder="Search ships, vendors, ports..." value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="flex items-center gap-3">
            {demoMode && <span className="rounded-full bg-status-pending/10 px-3 py-1 text-xs font-semibold text-status-pending">Demo Data</span>}
            <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100" type="button" aria-label="Notifications"><Bell size={18} /></button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{user?.username?.[0]?.toUpperCase()}</div>
              <div className="pr-1 text-left">
                <div className="text-sm font-medium text-navy">{user?.username}</div>
                <div className="text-xs text-slate-500">{user?.role}</div>
              </div>
              <button className="p-1 text-slate-500" onClick={logout} title="Logout"><LogOut size={16} /></button>
            </div>
          </div>
        </header>
        <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm ${isActive ? 'border-primary font-semibold text-primary' : 'border-transparent text-slate-600 hover:text-navy'}`}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <main className="flex-1 p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
