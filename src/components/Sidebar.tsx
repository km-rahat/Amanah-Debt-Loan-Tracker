import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Coins,
  CreditCard,
  FileCheck,
  BellRing,
  Settings as SettingsIcon,
  LogOut,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Borrowers', path: '/borrowers', icon: Users },
    { label: 'Loans', path: '/loans', icon: Coins },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Agreements', path: '/agreements', icon: FileCheck },
    { label: 'Reminder Logs', path: '/reminders', icon: BellRing },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-[#09090b] dark:text-slate-200 shadow-xl transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="app-sidebar"
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-500/10">
              A
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Amanah
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Loan Manager
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 font-semibold dark:bg-slate-800/50 dark:text-indigo-400'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/30'
                  }`
                }
                id={`sidebar-link-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`transition-colors duration-200 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute right-0 top-1/4 h-1/2 w-1 rounded-l-full bg-indigo-600 dark:bg-indigo-500" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Account block */}
        {user && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-900/50 p-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 rounded-lg object-cover"
                />
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </p>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                title="Log Out"
                id="sidebar-logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
