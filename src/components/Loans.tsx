import { useState, FormEvent } from 'react';
import { 
  Search, 
  PlusCircle, 
  Calendar, 
  Coins, 
  Landmark, 
  FileText, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  Info, 
  FileSignature, 
  Clock, 
  Edit3, 
  AlertCircle,
  Eye,
  DollarSign,
  User,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  ChevronRight,
  Plus,
  CoinsIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Loan, Borrower } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  useLoansQuery, 
  useBorrowersQuery, 
  usePaymentsQuery,
  useAgreementsQuery,
  useCreateLoanMutation, 
  useUpdateLoanMutation, 
  useDeleteLoanMutation 
} from '../hooks/useSupabaseQueries';
import { LoanTimeline } from './LoanTimeline';

type ViewState = 'list' | 'add' | 'edit' | 'profile';

export default function Loans() {
  const { formatCurrency: formatCurrencyFromContext } = useApp();
  const navigate = useNavigate();
  
  // Real Supabase data via React Query
  const { data: loans = [], isLoading, isError, error: fetchError } = useLoansQuery();
  const { data: borrowers = [] } = useBorrowersQuery();
  const { data: payments = [] } = usePaymentsQuery();
  const { data: agreements = [] } = useAgreementsQuery();
  
  const createLoanMutation = useCreateLoanMutation();
  const updateLoanMutation = useUpdateLoanMutation();
  const deleteLoanMutation = useDeleteLoanMutation();

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  
  // View states
  const [view, setView] = useState<ViewState>('list');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Overdue'>('All');

  // Form states
  const [borrowerId, setBorrowerId] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [notes, setNotes] = useState('');

  // Form validation touch states
  const [borrowerIdTouched, setBorrowerIdTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [purposeTouched, setPurposeTouched] = useState(false);
  const [loanDateTouched, setLoanDateTouched] = useState(false);
  const [dueDateTouched, setDueDateTouched] = useState(false);

  // Validation computes
  const isBorrowerValid = borrowerId !== '';
  const isAmountValid = amount !== '' && parseFloat(amount) > 0;
  const isPurposeValid = purpose.trim().length > 0;
  const isLoanDateValid = loanDate !== '';
  const isDueDateValid = dueDate !== '' && (loanDate === '' || new Date(dueDate) >= new Date(loanDate));

  // Check if selected borrower has an unpaid/outstanding loan
  const selectedBorrowerHasUnpaidLoan = Boolean(
    borrowerId &&
    loans.some(l => l.borrowerId === borrowerId && (l.remainingAmount > 0 || (l.status !== 'Completed' && l.status !== 'Fully Paid')))
  );

  const isFormValid = isBorrowerValid && isAmountValid && isPurposeValid && isLoanDateValid && isDueDateValid && (view !== 'add' || !selectedBorrowerHasUnpaidLoan);

  // Clear states when transitioning
  const handleOpenAdd = () => {
    setBorrowerId('');
    setAmount('');
    setPurpose('');
    setLoanDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setCurrency('BDT');
    setNotes('');
    
    // Reset touches
    setBorrowerIdTouched(false);
    setAmountTouched(false);
    setPurposeTouched(false);
    setLoanDateTouched(false);
    setDueDateTouched(false);
    
    setView('add');
  };

  const handleOpenEdit = (loan: Loan) => {
    setSelectedLoanId(loan.id);
    setBorrowerId(loan.borrowerId);
    setAmount(loan.amount.toString());
    setPurpose(loan.purpose);
    setLoanDate(loan.loanDate);
    setDueDate(loan.dueDate);
    setCurrency(loan.currency || 'BDT');
    setNotes(loan.notes || '');

    // Reset touches
    setBorrowerIdTouched(false);
    setAmountTouched(false);
    setPurposeTouched(false);
    setLoanDateTouched(false);
    setDueDateTouched(false);

    setView('edit');
  };

  const handleOpenProfile = (loanId: string) => {
    setSelectedLoanId(loanId);
    setView('profile');
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBorrowerIdTouched(true);
    setAmountTouched(true);
    setPurposeTouched(true);
    setLoanDateTouched(true);
    setDueDateTouched(true);

    if (selectedBorrowerHasUnpaidLoan) {
      showToast('This borrower already has an outstanding loan. New loan cannot be issued until it is fully repaid.', 'error');
      return;
    }

    if (!isFormValid) return;

    const selectedBorrower = borrowers.find(b => b.id === borrowerId);
    if (!selectedBorrower) return;

    createLoanMutation.mutate({
      borrowerId,
      borrowerName: selectedBorrower.name,
      amount: parseFloat(amount),
      purpose: purpose.trim(),
      loanDate,
      dueDate,
      status: 'Pending',
      currency,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        showToast('Loan advanced successfully', 'success');
        setView('list');
      },
      onError: (err: any) => {
        showToast(err?.message || 'Failed to create loan', 'error');
      }
    });
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBorrowerIdTouched(true);
    setAmountTouched(true);
    setPurposeTouched(true);
    setLoanDateTouched(true);
    setDueDateTouched(true);

    if (!isFormValid || !selectedLoanId) return;

    const selectedBorrower = borrowers.find(b => b.id === borrowerId);
    if (!selectedBorrower) return;

    updateLoanMutation.mutate({
      id: selectedLoanId,
      updated: {
        borrowerId,
        borrowerName: selectedBorrower.name,
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        loanDate,
        dueDate,
        currency,
        notes: notes.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        showToast('Loan updated successfully', 'success');
        setView('list');
      },
      onError: (err: any) => {
        showToast(err?.message || 'Failed to update loan', 'error');
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently remove loan agreement ${id} for ${name}? This will adjust borrower total statistics.`)) {
      deleteLoanMutation.mutate(id, {
        onSuccess: () => {
          showToast('Loan deleted successfully', 'success');
          if (selectedLoanId === id) {
            setView('list');
          }
        },
        onError: (err: any) => {
          showToast(err?.message || 'Failed to delete loan', 'error');
        }
      });
    }
  };

  // Filter loans
  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      l.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = l.status === 'Pending' || l.status === 'Active' || l.status === 'Partially Paid';
    } else if (statusFilter === 'Completed') {
      matchesStatus = l.status === 'Completed' || l.status === 'Fully Paid';
    } else if (statusFilter === 'Overdue') {
      matchesStatus = l.status === 'Overdue';
    }

    return matchesSearch && matchesStatus;
  });

  // Currency helper
  const formatCurrency = (val: number, currencyCode?: string) => {
    return formatCurrencyFromContext(val, currencyCode);
  };

  // Active Profile details
  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const selectedLoanPayments = selectedLoan 
    ? payments.filter(p => p.loanId === selectedLoan.id)
    : [];

  const paidAmountValue = selectedLoan ? (selectedLoan.amount - selectedLoan.remainingAmount) : 0;
  const paymentCount = selectedLoanPayments.length;

  return (
    <div className="space-y-6 animate-fade-in" id="loans-section">
      
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#161619] p-4 shadow-2xl animate-fade-in-up">
          <div className={`rounded-xl p-2 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{toast.type === 'success' ? 'Action Confirmed' : 'Action Failed'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
      
      {/* ==================== 1. LIST VIEW ==================== */}
      {view === 'list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header section */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Loans Registry
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Authorize structural advances, set maturity terms, and record partial or full debt settlement events.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
              id="btn-add-loan-view"
            >
              <PlusCircle size={14} />
              <span>Add Loan</span>
            </button>
          </div>

          {/* Search & Filters block */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Loan ID, Borrower, or Purpose..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-950 text-white transition-all"
                id="loan-search-input"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'All'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Loans ({loans.length})
              </button>
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Pending'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending ({loans.filter(l => l.status === 'Pending' || l.status === 'Active' || l.status === 'Partially Paid').length})
              </button>
              <button
                onClick={() => setStatusFilter('Completed')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Completed'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed ({loans.filter(l => l.status === 'Completed' || l.status === 'Fully Paid').length})
              </button>
              <button
                onClick={() => setStatusFilter('Overdue')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'Overdue'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overdue ({loans.filter(l => l.status === 'Overdue').length})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center" id="loans-loading-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-indigo-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
                <h3 className="mt-4 text-xs font-semibold text-slate-300">Loading loans from database...</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  Please wait while we establish a connection and retrieve the loans.
                </p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-rose-400" id="loans-error-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
                  <AlertCircle size={22} />
                </div>
                <h3 className="mt-2 text-xs font-semibold">Failed to load loans</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  {fetchError?.message || 'Please check your connection and try again.'}
                </p>
              </div>
            ) : loans.length === 0 ? (
              /* --- GLOBAL EMPTY STATE --- */
              <div className="flex flex-col items-center justify-center py-24 text-center" id="loans-empty-state">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-500 mb-4 border border-slate-800">
                  <Coins size={26} className="stroke-1.5 text-indigo-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">No Loans Registered Yet</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                  There are currently no active credit loan contracts recorded in your Amanah ledger. Click below to register your first disbursal.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-6 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Issue First Loan</span>
                </button>
              </div>
            ) : filteredLoans.length === 0 ? (
              /* --- NO SEARCH RESULTS EMPTY STATE --- */
              <div className="flex flex-col items-center justify-center py-20 text-center" id="loans-no-search">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-500 mb-3 border border-slate-800">
                  <Search size={20} className="stroke-1.5 text-rose-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-300">No matching loans found</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500 leading-relaxed">
                  Your search filters did not match any of our records. Adjust your keyword search or filter settings and try again.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                  className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Reset Search & Filters
                </button>
              </div>
            ) : (
              /* --- TABLE DATA --- */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Loan ID</th>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Purpose</th>
                      <th className="px-6 py-4">Loan Date</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-right">Remaining</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-800/20 transition-all">
                        {/* Loan ID */}
                        <td className="px-6 py-4 font-mono font-bold text-indigo-400">
                          {loan.id}
                        </td>
                        
                        {/* Borrower */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                              {loan.borrowerName.charAt(0)}
                            </div>
                            <span className="font-semibold text-white">{loan.borrowerName}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 font-mono text-right text-white font-semibold">
                          {formatCurrency(loan.amount, loan.currency)}
                        </td>

                        {/* Purpose */}
                        <td className="px-6 py-4 text-slate-400 max-w-[160px] truncate" title={loan.purpose}>
                          {loan.purpose}
                        </td>

                        {/* Loan Date */}
                        <td className="px-6 py-4 text-slate-400 font-mono text-2xs">
                          {loan.loanDate}
                        </td>

                        {/* Due Date */}
                        <td className="px-6 py-4 text-slate-400 font-mono text-2xs">
                          {loan.dueDate}
                        </td>

                        {/* Remaining */}
                        <td className="px-6 py-4 font-mono text-right text-indigo-400 font-semibold">
                          {formatCurrency(loan.remainingAmount, loan.currency)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                              loan.status === 'Overdue'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : loan.status === 'Completed' || loan.status === 'Fully Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : loan.status === 'Partially Paid'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenProfile(loan.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                              title="View Loan Details"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(loan)}
                              className="rounded-lg p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 transition-all cursor-pointer"
                              title="Edit Loan"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(loan.id, loan.borrowerName)}
                              className="rounded-lg p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                              title="Delete Loan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. ADD / EDIT VIEW ==================== */}
      {(view === 'add' || view === 'edit') && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Top Return navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#18181b] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                {view === 'add' ? 'Issue Structured Loan' : 'Update Loan Agreement'}
              </h1>
              <p className="text-2xs text-slate-400">
                {view === 'add' ? 'Initiate and record a structured credit disbursal into the ledger.' : `Modifying loan contract parameters for ${selectedLoanId}.`}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={view === 'add' ? handleAddSubmit : handleEditSubmit} className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-md space-y-6">
            
            {/* Form Section: Borrower Selection */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1">Client Identification</h3>
              
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                  Select Borrower <span className="text-indigo-400">*</span>
                </label>
                {borrowers.length === 0 ? (
                  <div className="p-3.5 rounded-lg border border-yellow-500/10 bg-yellow-500/5 text-yellow-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>No active borrowers found. You must register a borrower profile first before logging a loan.</span>
                  </div>
                ) : (
                  <select
                    value={borrowerId}
                    onChange={(e) => {
                      setBorrowerId(e.target.value);
                      setBorrowerIdTouched(true);
                    }}
                    onBlur={() => setBorrowerIdTouched(true)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                      borrowerIdTouched && !isBorrowerValid
                        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                    }`}
                  >
                    <option value="">-- Choose registered borrower profile --</option>
                    {borrowers.map((b) => {
                      const hasUnpaid = loans.some(l => l.borrowerId === b.id && (l.remainingAmount > 0 || (l.status !== 'Completed' && l.status !== 'Fully Paid')));
                      return (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.phone}){hasUnpaid ? ' — [Has Outstanding Loan]' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
                {borrowerIdTouched && !isBorrowerValid && (
                  <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                    <AlertCircle size={10} />
                    Borrower profile selection is required.
                  </p>
                )}
                {selectedBorrowerHasUnpaidLoan && view === 'add' && (
                  <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2 font-medium mt-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-400" />
                    <span>This borrower already has an outstanding loan. New loan cannot be issued until it is fully repaid.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section: Loan Financial Attributes */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Financial Parameters</h3>
              
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Amount */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Loan Amount <span className="text-indigo-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none font-mono text-xs">
                      {currency === 'BDT' ? '৳' : '$'}
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setAmountTouched(true);
                      }}
                      onBlur={() => setAmountTouched(true)}
                      placeholder="e.g. 50000"
                      className={`w-full pl-7 pr-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white font-mono ${
                        amountTouched && !isAmountValid
                          ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {amountTouched && !isAmountValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      Amount must be greater than zero.
                    </p>
                  )}
                </div>

                {/* Currency selection */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="OMR">OMR (ر.ع.)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SAR">SAR (ر.س)</option>
                  </select>
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                  Purpose / Category <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    setPurposeTouched(true);
                  }}
                  onBlur={() => setPurposeTouched(true)}
                  placeholder="e.g. Poultry Farm Expansion, Grocery Inventory Supply"
                  className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                    purposeTouched && !isPurposeValid
                      ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                  }`}
                />
                {purposeTouched && !isPurposeValid && (
                  <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                    <AlertCircle size={10} />
                    Purpose is required.
                  </p>
                )}
              </div>
            </div>

            {/* Form Section: Dates Parameters */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Maturity Timeline</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Loan Date */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Loan Date <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={loanDate}
                    onChange={(e) => {
                      setLoanDate(e.target.value);
                      setLoanDateTouched(true);
                    }}
                    onBlur={() => setLoanDateTouched(true)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                      loanDateTouched && !isLoanDateValid
                        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                    }`}
                  />
                  {loanDateTouched && !isLoanDateValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      Loan Date is required.
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Due Date <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setDueDateTouched(true);
                    }}
                    onBlur={() => setDueDateTouched(true)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                      dueDateTouched && !isDueDateValid
                        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                    }`}
                  />
                  {dueDateTouched && !isDueDateValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      Due Date cannot be earlier than Loan Date.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional notes section */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Additional Terms</h3>
              
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Notes / Deferrals</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record custom collateral terms, guarantor names, repayment schedule intervals, or special circumstances here..."
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white font-sans resize-none"
                />
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all cursor-pointer ${
                  isFormValid 
                    ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/10' 
                    : 'bg-indigo-900/40 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {view === 'add' ? 'Save Loan' : 'Commit Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. LOAN DETAILS VIEW ==================== */}
      {view === 'profile' && selectedLoan && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Actions Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#18181b] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-white">
                    Loan Profile {selectedLoan.id}
                  </h1>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold tracking-wide uppercase ${
                      selectedLoan.status === 'Overdue'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : selectedLoan.status === 'Completed' || selectedLoan.status === 'Fully Paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : selectedLoan.status === 'Partially Paid'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {selectedLoan.status}
                  </span>
                </div>
                <p className="text-2xs text-slate-400">
                  Tracing contract history and chronological settlement events.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {selectedLoan.remainingAmount > 0 && selectedLoan.status !== 'Completed' && selectedLoan.status !== 'Fully Paid' ? (
                <button
                  onClick={() => navigate(`/payments?loanId=${selectedLoan.id}&action=add`)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <PlusCircle size={13} />
                  <span>Add Payment</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Fully Paid</span>
                </div>
              )}
              <button
                onClick={() => handleOpenEdit(selectedLoan)}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#18181b] hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit Loan</span>
              </button>
              <button
                onClick={() => handleDelete(selectedLoan.id, selectedLoan.borrowerName)}
                className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-400 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Contract</span>
              </button>
            </div>
          </div>

          {/* Progress Bar Card Banner */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Settlement Progress</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({formatCurrency(paidAmountValue, selectedLoan.currency)} of {formatCurrency(selectedLoan.amount, selectedLoan.currency)})
                </span>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                {selectedLoan.amount > 0 ? Math.min(100, Math.round((paidAmountValue / selectedLoan.amount) * 100)) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                style={{
                  width: `${selectedLoan.amount > 0 ? Math.min(100, Math.max(0, (paidAmountValue / selectedLoan.amount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Core summary stats cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Original Amount */}
            <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original Amount</p>
              <p className="text-lg font-extrabold text-white mt-2 font-mono">
                {formatCurrency(selectedLoan.amount, selectedLoan.currency)}
              </p>
              <p className="text-[9px] text-slate-500 mt-1">Disbursed Principal</p>
            </div>

            {/* Paid Amount */}
            <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid Amount</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-2 font-mono">
                {formatCurrency(paidAmountValue, selectedLoan.currency)}
              </p>
              <p className="text-[9px] text-slate-500 mt-1">Settled Aggregate</p>
            </div>

            {/* Remaining Amount */}
            <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Amount</p>
              <p className="text-lg font-extrabold text-indigo-400 mt-2 font-mono">
                {formatCurrency(selectedLoan.remainingAmount, selectedLoan.currency)}
              </p>
              <p className="text-[9px] text-slate-500 mt-1">Outstanding Balance</p>
            </div>

            {/* Total Payments Count */}
            <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payments</p>
              <p className="text-lg font-extrabold text-white mt-2 font-mono">
                {paymentCount}
              </p>
              <p className="text-[9px] text-slate-500 mt-1">Repayment Events</p>
            </div>
          </div>

          {/* Central Grid Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Left Column: Loan Details Details */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-5">
                <h3 className="text-2xs font-bold text-indigo-400 uppercase tracking-wider block border-b border-slate-800 pb-2">Loan Information</h3>
                
                {/* ID parameter */}
                <div className="flex items-start gap-2 text-xs">
                  <Coins size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Loan Identifier</p>
                    <p className="font-mono text-white mt-0.5">{selectedLoan.id}</p>
                  </div>
                </div>

                {/* Borrower */}
                <div className="flex items-start gap-2 text-xs">
                  <User size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Borrower profile</p>
                    <p className="font-semibold text-white mt-0.5">{selectedLoan.borrowerName}</p>
                  </div>
                </div>

                {/* Original Amount */}
                <div className="flex items-start gap-2 text-xs">
                  <DollarSign size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Approved Principal</p>
                    <p className="font-mono text-white mt-0.5">{formatCurrency(selectedLoan.amount, selectedLoan.currency)}</p>
                  </div>
                </div>

                {/* Remaining Amount */}
                <div className="flex items-start gap-2 text-xs">
                  <Clock size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Remaining Balance</p>
                    <p className="font-mono text-indigo-400 font-bold mt-0.5">{formatCurrency(selectedLoan.remainingAmount, selectedLoan.currency)}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-2 text-xs">
                  <Calendar size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Disbursal Issue Date</p>
                    <p className="font-mono text-white mt-0.5">{selectedLoan.loanDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <Calendar size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Maturity Due Date</p>
                    <p className="font-mono text-white mt-0.5">{selectedLoan.dueDate}</p>
                  </div>
                </div>

                {/* Purpose */}
                <div className="flex items-start gap-2 text-xs pt-2 border-t border-slate-800/50">
                  <FileText size={14} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500">Allocated Purpose</p>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{selectedLoan.purpose}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedLoan.notes && (
                  <div className="flex items-start gap-2 text-xs pt-2 border-t border-slate-800/50">
                    <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">Private Ledger Notes</p>
                      <p className="text-slate-400 mt-0.5 leading-relaxed italic">{selectedLoan.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Columns: Payment Timeline & Legal Agreement */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Interactive Loan Timeline Engine Component */}
              <LoanTimeline loanId={selectedLoan.id} />

              {/* Repayments Detailed Table Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Repayments List
                  </h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    {selectedLoanPayments.length} Payments
                  </span>
                </div>

                {selectedLoanPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-850 rounded-xl bg-slate-950/10">
                    <p className="text-xs font-semibold text-slate-500">No repayment entries found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/10 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 px-3">Payment ID</th>
                          <th className="py-2.5 px-3 text-right">Amount Paid</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-2xs text-slate-300">
                        {selectedLoanPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/10 transition-all">
                            <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">{p.id}</td>
                            <td className="py-2.5 px-3 text-right text-white font-mono font-semibold">
                              {formatCurrency(p.amount, selectedLoan.currency)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex rounded bg-slate-850 px-1.5 py-0.5 text-[8px] font-bold uppercase text-slate-400">
                                {p.method}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{p.paymentDate}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-indigo-400 font-semibold">
                              {formatCurrency(p.remainingBalanceAfter ?? 0, selectedLoan.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Agreement Section Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                  <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Agreement Summary Card
                  </h3>
                  <FileSignature size={14} className="text-indigo-400" />
                </div>

                {(() => {
                  const assocAgreement = agreements.find(a => a.loanId === selectedLoan.id);
                  if (assocAgreement) {
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Number</p>
                            <p className="font-mono text-white font-bold">{assocAgreement.id}</p>
                          </div>
                          <div className="space-y-0.5 text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                            <div>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase border ${
                                assocAgreement.status === 'Signed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : assocAgreement.status === 'Pending'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : assocAgreement.status === 'Draft'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                {assocAgreement.status}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Version</p>
                            <p className="font-mono text-indigo-400 font-bold text-[10px]">{assocAgreement.version}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/agreements?id=${assocAgreement.id}`)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-3 py-2.5 text-2xs font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View Agreement</span>
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-center space-y-1">
                          <p className="text-2xs font-semibold text-slate-400">No Associated Agreement Found</p>
                          <p className="text-[10px] text-slate-500">Every loan must have one legal deed agreement to be fully compliant.</p>
                        </div>
                        <button
                          onClick={() => navigate(`/agreements?action=create&loanId=${selectedLoan.id}`)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-2xs font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Generate Agreement</span>
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
