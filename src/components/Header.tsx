import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, User as UserIcon, Shield, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { user, logout, darkMode, setDarkMode, activities } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Generate dynamic breadcrumbs
  const pathnames = location.pathname.split('/').filter((x) => x);
  const getBreadcrumbLabel = (path: string) => {
    const map: { [key: string]: string } = {
      dashboard: 'Dashboard',
      borrowers: 'Borrowers',
      loans: 'Loans',
      payments: 'Payments',
      agreements: 'Agreements',
      reminders: 'Reminder Logs',
      settings: 'Settings',
    };
    return map[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/85 dark:border-slate-800 dark:bg-[#09090b]/85 px-6 shadow-xs backdrop-blur-md transition-colors duration-200">
      {/* Breadcrumb section */}
      <div className="flex items-center gap-2 text-sm">
        <span 
          onClick={() => navigate('/')} 
          className="cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          id="breadcrumb-home"
        >
          Amanah
        </span>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          return (
            <div key={to} className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-600">/</span>
              {last ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100" id={`breadcrumb-active-${value}`}>
                  {getBreadcrumbLabel(value)}
                </span>
              ) : (
                <span
                  onClick={() => navigate(to)}
                  className="cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  id={`breadcrumb-${value}`}
                >
                  {getBreadcrumbLabel(value)}
                </span>
              )}
            </div>
          );
        })}
        {pathnames.length === 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100" id="breadcrumb-active-dashboard">
              Dashboard
            </span>
          </div>
        )}
      </div>

      {/* Navigation actions */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white active:scale-95"
          title="Toggle Dark Mode"
          id="dark-mode-toggle"
        >
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white active:scale-95"
            id="notifications-bell"
          >
            <Bell size={18} />
            {activities.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#09090b]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-200 p-4 shadow-2xl ring-1 ring-black/10 dark:ring-black/20">
              <div className="mb-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</span>
                <span className="text-xs text-slate-500">{activities.length} total</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No new notifications</div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div key={act.id} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{act.message}</span>
                        <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-850"
              id="user-profile-button"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-lg object-cover ring-2 ring-slate-200 dark:ring-slate-800"
              />
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>
              <ChevronDown size={14} className="hidden text-slate-500 md:block" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-200 p-2 shadow-2xl ring-1 ring-black/10 dark:ring-black/20">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                <div className="mt-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    id="profile-dropdown-settings"
                  >
                    <UserIcon size={14} />
                    <span>My Profile</span>
                  </button>
                  <div className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <Shield size={14} />
                    <span>{user.role}</span>
                  </div>
                  <hr className="my-1 border-slate-200 dark:border-slate-800" />
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    id="profile-dropdown-logout"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
