import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import ChangePasswordModal from './admin/ChangePasswordModal';
import { DashboardIcon, ReportsIcon, SettingsIcon, HelpIcon, UsersIcon, CoursesIcon } from '@/components/NavIcons';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/progress', label: 'Progress Analytics', Icon: ReportsIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/courses', label: 'Courses', Icon: CoursesIcon },
  { to: '/reports', label: 'Reports', Icon: ReportsIcon },
  { to: '/settings', label: 'Manage Trainees', Icon: SettingsIcon },
  { to: '/how-to-use', label: 'How to Use', Icon: HelpIcon },
];

function NavLink({ to, label, Icon, isActive }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'border-l-4 border-blue-700 bg-blue-50 pl-2 text-blue-700'
          : 'border-l-4 border-transparent pl-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon />
      {label}
    </Link>
  );
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 py-6 sm:flex">
          <div className="mb-8 px-3">
            <p className="text-sm font-bold text-slate-900">IDHS Trainee Tracker</p>
            <p className="text-xs text-slate-400">Illinois DHS</p>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                label={item.label}
                Icon={item.Icon}
                isActive={location.pathname === item.to}
              />
            ))}
          </nav>
          <div className="border-t border-slate-100 px-3 py-4">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{user?.name}</p>
            {isAdmin && <p className="text-xs text-blue-700">Administrator</p>}
            <div className="mt-3 flex flex-col gap-2">
              <ChangePasswordModal />
              <button
                onClick={logout}
                className="w-full rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
            <p className="text-sm font-bold text-slate-900">IDHS Trainee Tracker</p>
            <button onClick={logout} className="rounded-md px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800">Log out</button>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 sm:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                  location.pathname === item.to ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="p-6 pb-24">{children}</main>
        </div>
      </div>
    </div>
  );
}
