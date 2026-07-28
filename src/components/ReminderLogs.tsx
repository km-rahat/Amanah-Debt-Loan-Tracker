import { useState, FormEvent } from 'react';
import { Search, BellRing, PlusCircle, AlertCircle, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLoansQuery, useBorrowersQuery } from '../hooks/useSupabaseQueries';

export default function ReminderLogs() {
  const { reminderLogs, addReminder } = useApp();
  const { data: loans = [] } = useLoansQuery();
  const { data: borrowers = [] } = useBorrowersQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [borrowerName, setBorrowerName] = useState('');
  const [loanId, setLoanId] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'Sent' | 'Pending' | 'Failed'>('Sent');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!borrowerName || !loanId || !note) return;

    addReminder({
      borrowerName,
      loanId,
      status,
      note,
    });

    // Reset Form
    setBorrowerName('');
    setLoanId('');
    setNote('');
    setStatus('Sent');
    setShowAddModal(false);
  };

  // Filter reminder logs
  const filteredLogs = reminderLogs.filter(
    (r) =>
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.loanId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="reminders-view">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Reminder Alerts & Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch SMS or email alerts to overdue accounts, write custom notices, and monitor status.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
          id="btn-add-reminder"
        >
          <BellRing size={14} />
          <span>Dispatch Alert</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search reminder logs by ID, borrower, or loan..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-950 text-white transition-all"
            id="reminder-search-input"
          />
        </div>
      </div>

      {/* Reminder Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#18181b] shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center" id="reminders-empty-state">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-500">
              <BellRing size={22} className="stroke-1" />
            </div>
            <h3 className="mt-4 text-xs font-semibold text-slate-300">No logs on record</h3>
            <p className="mt-1 max-w-xs text-[11px] text-slate-500">
              No alert logs exist. Click "Dispatch Alert" to trigger a reminder template for a borrower with pending balances.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Reminder ID</th>
                  <th className="px-6 py-3.5">Borrower</th>
                  <th className="px-6 py-3.5">Loan ID</th>
                  <th className="px-6 py-3.5">Reminder Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Note</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-400">{log.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{log.borrowerName}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{log.loanId}</td>
                    <td className="px-6 py-4 text-slate-400">{log.reminderDate}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                          log.status === 'Failed'
                            ? 'bg-rose-500/10 text-rose-400'
                            : log.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate" title={log.note}>
                      {log.note}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => alert(`Re-sending reminder alert for ${log.borrowerName}...`)}
                        className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer"
                        title="Re-send Alert"
                      >
                        <Send size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#18181b] rounded-2xl p-6 shadow-2xl border border-slate-800 animate-fade-in-up">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-6">
              <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-400">
                <BellRing size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dispatch notification alert</h3>
                <p className="text-[10px] text-slate-400">Issue custom SMS/Email reminders to active accounts.</p>
              </div>
            </div>

            {loans.length === 0 ? (
              <div className="py-6 text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-3">
                  <AlertCircle size={20} />
                </div>
                <h4 className="text-xs font-semibold text-white">No active loans</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                  You must record a loan transaction before drafting alert notices.
                </p>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-2xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 cursor-pointer"
                >
                  Understood
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="space-y-4">
                {/* Select Borrower */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Target Borrower</label>
                  <select
                    required
                    value={borrowerName}
                    onChange={(e) => {
                      setBorrowerName(e.target.value);
                      // Auto-select a matching loan for this borrower
                      const borrowerLoan = loans.find((l) => l.borrowerName === e.target.value);
                      if (borrowerLoan) {
                        setLoanId(borrowerLoan.id);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                    id="add-reminder-borrower-select"
                  >
                    <option value="">-- Choose recipient borrower --</option>
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Loan ID (Filtered by borrower) */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Associated Loan ID</label>
                  <select
                    required
                    value={loanId}
                    onChange={(e) => setLoanId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                    id="add-reminder-loan-select"
                  >
                    <option value="">-- Choose loan ID --</option>
                    {loans
                      .filter((l) => !borrowerName || l.borrowerName === borrowerName)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.id} - ({l.purpose})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Alert Dispatch Status</label>
                  <select
                    required
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                    id="add-reminder-status-select"
                  >
                    <option value="Sent">Sent (Success)</option>
                    <option value="Pending">Pending (Queue)</option>
                    <option value="Failed">Failed (Error)</option>
                  </select>
                </div>

                {/* Custom note */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Custom Note / SMS Template</label>
                  <textarea
                    required
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Asalamu Alaikum, this is a gentle reminder that your loan principal of $5,000 has a due date on 2026-08-01. Please settle accordingly."
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white resize-none font-sans"
                    id="add-reminder-note-textarea"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-2xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-2xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer"
                    id="add-reminder-submit"
                  >
                    Transmit Notice
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
