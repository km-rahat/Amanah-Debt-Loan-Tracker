import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  CircleDollarSign,
  Clock,
  AlertOctagon,
  ArrowRight,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  Activity as ActivityIcon,
  CalendarCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLoansQuery, useBorrowersQuery, usePaymentsQuery } from '../hooks/useSupabaseQueries';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { activities, formatCurrency } = useApp();
  const navigate = useNavigate();

  const { data: loans = [], isLoading: isLoansLoading, isError: isLoansError, error: loansError } = useLoansQuery();
  const { data: borrowers = [], isLoading: isBorrowersLoading, isError: isBorrowersError } = useBorrowersQuery();
  const { data: payments = [], isLoading: isPaymentsLoading } = usePaymentsQuery();

  const isLoading = isLoansLoading || isBorrowersLoading || isPaymentsLoading;
  const isError = isLoansError || isBorrowersError;

  // Dynamic calculations based on loans table remaining_amount and amount
  const totalLent = loans.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCollected = loans.reduce((acc, curr) => acc + (curr.amount - curr.remainingAmount), 0);
  const pendingAmount = loans.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const overdueLoansCount = loans.filter((l) => l.status === 'Overdue').length;

  // Get pending / partially paid / overdue loans sorted by nearest due date
  const upcomingDueLoans = loans
    .filter((l) => l.status === 'Pending' || l.status === 'Partially Paid' || l.status === 'Overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center" id="dashboard-loading-state">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-indigo-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
        <h3 className="mt-4 text-xs font-semibold text-slate-300">Loading operational dashboard data...</h3>
        <p className="mt-1 max-w-xs text-[11px] text-slate-500">
          Please wait while we establish a connection and retrieve the ledger records.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center text-rose-400" id="dashboard-error-state">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
          <AlertCircle size={22} />
        </div>
        <h3 className="mt-2 text-xs font-semibold">Failed to load dashboard metrics</h3>
        <p className="mt-1 max-w-xs text-[11px] text-slate-500">
          {loansError?.message || 'Please check your connection and try again.'}
        </p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Lent',
      value: formatCurrency(totalLent),
      icon: TrendingUp,
      colorClass: 'text-indigo-400 bg-indigo-500/10',
      description: 'Cumulative credit issued',
    },
    {
      title: 'Total Collected',
      value: formatCurrency(totalCollected),
      icon: CircleDollarSign,
      colorClass: 'text-emerald-400 bg-emerald-500/10',
      description: 'Principal recovered to date',
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(pendingAmount),
      icon: Clock,
      colorClass: 'text-amber-400 bg-amber-500/10',
      description: 'Outstanding credit ledger',
    },
    {
      title: 'Overdue Loans',
      value: overdueLoansCount.toString(),
      icon: AlertOctagon,
      colorClass: 'text-rose-400 bg-rose-500/10',
      description: 'Accounts requiring dispatch',
    },
  ];

  return (
    <div className="space-y-8" id="dashboard-view">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System health summary, accounts ledger aggregates, and recent system interactions.
          </p>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/borrowers')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-300 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold transition-all shadow-xs"
            id="quick-add-borrower"
          >
            <UserPlus size={14} />
            <span>Borrowers Portal</span>
          </button>
          <button
            onClick={() => navigate('/loans')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-500 shadow-xs"
            id="quick-add-loan"
          >
            <PlusCircle size={14} />
            <span>New Loan Log</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-100 p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`rounded-xl p-2.5 ${stat.colorClass}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  {stat.value}
                </h3>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main split dashboard section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Upcoming Due Loans */}
        <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-100 p-6 shadow-xs lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
                <CalendarCheck size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Due Loans
              </h2>
            </div>
            {upcomingDueLoans.length > 0 && (
              <button
                onClick={() => navigate('/loans')}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {upcomingDueLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" id="upcoming-loans-empty">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500">
                <FileSpreadsheet size={22} className="stroke-1" />
              </div>
              <h3 className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">No upcoming due dates</h3>
              <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                All outstanding ledgers are clear or have been fully settled. No actions required.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3">Borrower</th>
                    <th className="py-3">Remaining</th>
                    <th className="py-3">Due Date</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {upcomingDueLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{loan.borrowerName}</td>
                      <td className="py-3 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(loan.remainingAmount)}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{loan.dueDate}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-relaxed ${
                            loan.status === 'Overdue'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 col: Recent Activities */}
        <div className="rounded-2xl border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-[#18181b] dark:text-slate-100 p-6 shadow-xs">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
                <ActivityIcon size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Activities
              </h2>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" id="activities-empty">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500">
                <ActivityIcon size={22} className="stroke-1" />
              </div>
              <h3 className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">Activity stream clear</h3>
              <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                Once transactions, borrower registrations, and payments are logged, they will stream here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="relative pl-6 pb-2 border-l border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                  <span className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal font-medium">{act.message}</p>
                  <span className="text-[9px] text-slate-500 block mt-0.5">{act.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
