import { useState, FormEvent } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { user, darkMode, setDarkMode, currency, setCurrency } = useApp();
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6" id="settings-view">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Adjust user profile configurations, currency parameters, and automated notification thresholds.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left menu helper info cards */}
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-100 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Configuration Help</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              These settings apply immediately to your browser session. Integrations for permanent databases or OAuth credentials can be mounted using the developer workspace guidelines.
            </p>
          </div>
        </div>

        {/* Right forms section */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-100 p-6 shadow-xs space-y-6">
            
            {/* Save notice */}
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={16} />
                <span>Configurations successfully committed to operational memory!</span>
              </div>
            )}

            {/* Profile section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">User Profile</h3>
              </div>

              {user && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Admin Name</label>
                    <input
                      type="text"
                      disabled
                      value={user.name}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Role Permissions</label>
                    <input
                      type="text"
                      disabled
                      value={user.role}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-medium"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Operational Email</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* App settings section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">System Preferences</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Default Currency Representation</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                    <option value="USD">USD ($) - United States Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="OMR">OMR (ر.ع.) - Omani Rial</option>
                    <option value="AED">AED (د.إ) - UAE Dirham</option>
                    <option value="SAR">SAR (ر.س) - Saudi Riyal</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Client Interface Appearance</label>
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className={`flex items-center justify-between w-full px-3 py-2 border rounded-lg text-xs transition-colors cursor-pointer bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300`}
                  >
                    <span>Visual Theme</span>
                    <span className="font-semibold">{darkMode ? 'Dark Mode Active' : 'Light Mode Active'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notification preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Bell size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Notification Dispatches</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block">Automated SMS Dispatches</span>
                    <span className="text-[10px] text-slate-500 block">Trigger instant reminder SMS when loans enter "Overdue" status state.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-950"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block">Automated Email Contracts</span>
                    <span className="text-[10px] text-slate-500 block">Disburse formal PDF agreement attachments via email when deeds are structured.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit settings button */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
                id="btn-save-settings"
              >
                Commit Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
