import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import ChangePasswordModal from './admin/ChangePasswordModal';
import { DashboardIcon, ReportsIcon, SettingsIcon, HelpIcon, UsersIcon, CoursesIcon } from '@/components/NavIcons';

// Logical navigation order: Dashboard → Progress → Submissions → Bottlenecks → Trainees → Courses → Users → Reports → Help
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/progress', label: 'Progress', Icon: ReportsIcon },
  { to: '/analytics/submission-rate', label: 'Submissions', Icon: ReportsIcon },
  { to: '/analytics/bottleneck', label: 'Bottlenecks', Icon: ReportsIcon },
  { to: '/settings', label: 'Trainees', Icon: SettingsIcon },
  { to: '/courses', label: 'Courses', Icon: CoursesIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/reports', label: 'Reports', Icon: ReportsIcon },
  { to: '/how-to-use', label: 'Help', Icon: HelpIcon },
];

function NavLink({ to, label, Icon, isActive }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium text-slate-900">{user?.name}</p>
        {isAdmin && <p className="text-xs text-blue-600">Administrator</p>}
      </div>
      <div className="flex flex-col gap-2">
        <ChangePasswordModal />
        <button
          onClick={logout}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          {/* Top Row: Logo + User Menu */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-lg font-bold text-slate-900">IDHS Trainee Tracker</p>
              <p className="text-xs text-slate-400">Illinois Department of Human Services</p>
            </div>
            <div className="hidden sm:block">
              <UserMenu />
            </div>
          </div>

          {/* Navigation Row */}
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 py-2">
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
        </div>

        {/* Mobile User Menu */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:hidden">
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
