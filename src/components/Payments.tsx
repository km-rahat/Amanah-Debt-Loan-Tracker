import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  CreditCard, 
  Receipt, 
  FileText, 
  Check, 
  Landmark, 
  Trash2, 
  Calendar, 
  ArrowLeft, 
  Edit3, 
  Eye, 
  PlusCircle, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Coins, 
  DollarSign, 
  X, 
  FileSignature, 
  Hash, 
  Info,
  Clock,
  Loader2
} from 'lucide-react';
import { Payment, Loan } from '../types';
import { PaymentReceipt } from './PaymentReceipt';
import { 
  usePaymentsQuery, 
  useCreatePaymentMutation, 
  useUpdatePaymentMutation, 
  useDeletePaymentMutation, 
  useLoansQuery,
  useAgreementsQuery
} from '../hooks/useSupabaseQueries';

import { useApp } from '../context/AppContext';

type ViewState = 'list' | 'add' | 'edit' | 'receipt';

export default function Payments() {
  const { formatCurrency: formatCurrencyFromContext } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramLoanId = searchParams.get('loanId');
  const paramAction = searchParams.get('action');

  // Fetch payments, loans & agreements via React Query
  const { data: payments = [], isLoading, isError, error } = usePaymentsQuery();
  const { data: loans = [] } = useLoansQuery();
  const { data: agreements = [] } = useAgreementsQuery();

  // React Query Mutations
  const createPaymentMutation = useCreatePaymentMutation();
  const updatePaymentMutation = useUpdatePaymentMutation();
  const deletePaymentMutation = useDeletePaymentMutation();
  
  // Navigation View State
  const [view, setView] = useState<ViewState>('list');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoanFilter, setSelectedLoanFilter] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Today' | 'ThisMonth' | 'CompletedLoans' | 'PendingLoans'>('All');

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    agreementId?: string;
    loanId?: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error', agreementId?: string, loanId?: string) => {
    setToast({ message, type, agreementId, loanId });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  // Form states
  const [loanId, setLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'Bank Transfer' | 'Cash' | 'Card' | 'Mobile Money' | 'Cheque' | 'Mobile Banking' | 'Other'>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Handle URL deep-linking for quick payment creation
  useEffect(() => {
    if (paramAction === 'add' && paramLoanId) {
      setLoanId(paramLoanId);
      setView('add');
    }
  }, [paramAction, paramLoanId]);

  // Form validation touch states
  const [loanIdTouched, setLoanIdTouched] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [paymentDateTouched, setPaymentDateTouched] = useState(false);

  // Auto-filled loan metrics
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Synchronize selected loan details when loanId changes
  useEffect(() => {
    if (loanId) {
      const found = loans.find(l => l.id === loanId);
      setSelectedLoan(found || null);
    } else {
      setSelectedLoan(null);
    }
  }, [loanId, loans]);

  // Handle Edit prefills
  const handleOpenEdit = (payment: Payment) => {
    setSelectedPaymentId(payment.id);
    setLoanId(payment.loanId);
    setAmount(payment.amount.toString());
    setPaymentDate(payment.paymentDate);
    setMethod(payment.method);
    setReferenceNumber(payment.referenceNumber || '');
    setNotes(payment.notes || '');

    setLoanIdTouched(false);
    setAmountTouched(false);
    setPaymentDateTouched(false);
    setView('edit');
  };

  const handleOpenAdd = () => {
    setLoanId('');
    setAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setMethod('Bank Transfer');
    setReferenceNumber('');
    setNotes('');

    setLoanIdTouched(false);
    setAmountTouched(false);
    setPaymentDateTouched(false);
    setView('add');
  };

  const handleOpenReceipt = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setView('receipt');
  };

  // Form validation computes (add view)
  const isLoanValid = loanId !== '';
  const isPaymentDateValid = paymentDate !== '';
  
  // Dynamic maximum remaining balance validation
  const getMaximumAllowed = () => {
    if (view === 'edit' && selectedPaymentId) {
      const originalPayment = payments.find(p => p.id === selectedPaymentId);
      if (selectedLoan && originalPayment) {
        // When editing, the original amount can be re-applied or changed, so max is: remainingAmount + original amount
        return selectedLoan.remainingAmount + originalPayment.amount;
      }
    }
    return selectedLoan ? selectedLoan.remainingAmount : 0;
  };

  const maxAllowed = getMaximumAllowed();
  const parsedAmount = parseFloat(amount);
  const isAmountValid = amount !== '' && !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= maxAllowed;

  const isFormValid = isLoanValid && isPaymentDateValid && isAmountValid;

  // Form Submit: Add
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoanIdTouched(true);
    setAmountTouched(true);
    setPaymentDateTouched(true);

    if (!isFormValid || !selectedLoan) return;

    try {
      await createPaymentMutation.mutateAsync({
        borrowerName: selectedLoan.borrowerName,
        loanId,
        amount: parsedAmount,
        paymentDate,
        method,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const relatedAgreement = agreements.find(a => a.loanId === loanId);
      showToast(
        `Payment of ${formatCurrency(parsedAmount, selectedLoan.currency)} successfully recorded!`,
        'success',
        relatedAgreement?.id,
        loanId
      );
      setView('list');
    } catch (err: any) {
      showToast(err.message || 'Failed to create payment record in Supabase.', 'error');
    }
  };

  // Form Submit: Edit
  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoanIdTouched(true);
    setAmountTouched(true);
    setPaymentDateTouched(true);

    if (!isFormValid || !selectedLoan || !selectedPaymentId) return;

    try {
      await updatePaymentMutation.mutateAsync({
        id: selectedPaymentId,
        updated: {
          loanId,
          borrowerName: selectedLoan.borrowerName,
          amount: parsedAmount,
          paymentDate,
          method,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      const relatedAgreement = agreements.find(a => a.loanId === loanId);
      showToast(
        `Payment ${selectedPaymentId} successfully updated!`,
        'success',
        relatedAgreement?.id,
        loanId
      );
      setView('list');
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment record in Supabase.', 'error');
    }
  };

  // Handle Delete with verification
  const handleDelete = async (id: string, name: string, amt: number) => {
    if (confirm(`Are you sure you want to permanently reverse payment transaction ${id} of ${formatCurrency(amt)}? This will restore the client outstanding balance.`)) {
      try {
        await deletePaymentMutation.mutateAsync(id);
        showToast(`Payment transaction ${id} successfully reversed!`, 'success');
        if (selectedPaymentId === id) {
          setView('list');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to delete payment record.', 'error');
      }
    }
  };

  // Currency helper
  const formatCurrency = (val: number, currencyCode?: string) => {
    return formatCurrencyFromContext(val, currencyCode);
  };

  // Filter payments by search term, loan filter, and active date/status filter
  const filteredPayments = payments.filter((p) => {
    // 1. Filter by Loan ID if selected
    if (selectedLoanFilter !== 'ALL' && p.loanId !== selectedLoanFilter) {
      return false;
    }

    // 2. Search filter: Borrower, Loan ID, Payment ID, Ref Number, Notes, Txn ID, Receipt Number
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      p.borrowerName.toLowerCase().includes(searchLower) ||
      p.loanId.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchLower)) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(searchLower)) ||
      (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchLower)) ||
      (p.notes && p.notes.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // 3. Active filters: All, Today, This Month, Completed Loans, Pending Loans
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = new Date().toISOString().substring(0, 7);
    const assocLoan = loans.find(l => l.id === p.loanId);

    if (activeFilter === 'Today') {
      return p.paymentDate === todayStr;
    }
    if (activeFilter === 'ThisMonth') {
      return p.paymentDate.startsWith(thisMonthStr);
    }
    if (activeFilter === 'CompletedLoans') {
      return assocLoan ? (assocLoan.status === 'Completed' || assocLoan.status === 'Fully Paid') : false;
    }
    if (activeFilter === 'PendingLoans') {
      return assocLoan ? (assocLoan.status === 'Pending' || assocLoan.status === 'Partially Paid' || assocLoan.status === 'Active' || assocLoan.status === 'Overdue') : false;
    }

    return true; // 'All'
  });

  const selectedPayment = payments.find(p => p.id === selectedPaymentId);
  const selectedPaymentLoan = selectedPayment ? loans.find(l => l.id === selectedPayment.loanId) : null;

  return (
    <div className="space-y-6 animate-fade-in" id="payments-section">
      
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#161619] p-4 shadow-2xl animate-fade-in-up">
          <div className={`rounded-xl p-2 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{toast.type === 'success' ? 'Action Confirmed' : 'Action Failed'}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{toast.message}</p>
            {toast.type === 'success' && (toast.agreementId || toast.loanId) && (
              <button
                onClick={() => {
                  const targetId = toast.agreementId || toast.loanId;
                  navigate(`/agreements?id=${targetId}`);
                  setToast(null);
                }}
                className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                <FileSignature size={12} />
                <span>Agreement updated — View/Download</span>
              </button>
            )}
          </div>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ==================== 1. LIST VIEW ==================== */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Header section */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Payments Registry
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Reconcile outstanding balances, record partial or full debt paybacks, and print compliant digital receipts powered by Supabase.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
              id="btn-add-payment-view"
            >
              <PlusCircle size={14} />
              <span>Record Repayment</span>
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
                placeholder="Search by Payment ID, Loan ID, Borrower, Txn ID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-950 text-white transition-all"
                id="payment-search-input-box"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filter by Loan Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-2xs text-slate-400">
                <Filter size={12} className="text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-400 shrink-0">Loan:</span>
                <select
                  value={selectedLoanFilter}
                  onChange={(e) => setSelectedLoanFilter(e.target.value)}
                  className="bg-transparent text-white font-semibold text-2xs focus:outline-none cursor-pointer py-1"
                  id="filter-by-loan-select"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Loans</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                      {l.id} - {l.borrowerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
                <button
                  onClick={() => setActiveFilter('All')}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'All'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({payments.length})
                </button>
                <button
                  onClick={() => setActiveFilter('Today')}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'Today'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveFilter('ThisMonth')}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'ThisMonth'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setActiveFilter('CompletedLoans')}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'CompletedLoans'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed Loans
                </button>
                <button
                  onClick={() => setActiveFilter('PendingLoans')}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === 'PendingLoans'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending Loans
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] shadow-sm overflow-hidden">
            {isLoading ? (
              /* --- LOADING STATE --- */
              <div className="flex flex-col items-center justify-center py-20 text-center" id="payments-loading-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20 animate-spin">
                  <Loader2 size={22} />
                </div>
                <h3 className="text-xs font-bold text-slate-300">Loading Payments from Supabase...</h3>
                <p className="mt-1 text-[11px] text-slate-500">Please wait while we fetch the latest transaction records.</p>
              </div>
            ) : isError ? (
              /* --- ERROR STATE --- */
              <div className="flex flex-col items-center justify-center py-20 text-center" id="payments-error-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
                  <AlertCircle size={22} />
                </div>
                <h3 className="text-xs font-bold text-slate-300">Failed to load payments</h3>
                <p className="mt-1 max-w-sm text-[11px] text-slate-500">{(error as any)?.message || 'An error occurred while connecting to Supabase.'}</p>
              </div>
            ) : payments.length === 0 ? (
              /* --- NO PAYMENTS AT ALL EMPTY STATE --- */
              <div className="flex flex-col items-center justify-center py-24 text-center" id="payments-no-records-state">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-500 mb-4 border border-slate-800">
                  <Receipt size={26} className="stroke-1.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">No Payments Recorded</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                  There are currently no cash or digital loan repayment records logged in Supabase. Click below to record a repayment.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-6 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Record First Payment</span>
                </button>
              </div>
            ) : filteredPayments.length === 0 ? (
              /* --- NO MATCHING SEARCH / FILTER EMPTY STATE --- */
              <div className="flex flex-col items-center justify-center py-20 text-center" id="payments-history-empty-search">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-500 mb-3 border border-slate-800">
                  <Search size={20} className="stroke-1.5 text-rose-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-300">No Payment History found</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500 leading-relaxed">
                  Your current search terms or filter selection did not match any registered transactions.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLoanFilter('ALL');
                    setActiveFilter('All');
                  }}
                  className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* --- TABLE DATA --- */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Receipt Number</th>
                      <th className="px-6 py-4">Payment ID</th>
                      <th className="px-6 py-4">Loan ID</th>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4 text-right">Payment Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Payment Date</th>
                      <th className="px-6 py-4 text-right">Balance After Payment</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {filteredPayments.map((payment) => {
                      const assocLoan = loans.find(l => l.id === payment.loanId);
                      return (
                        <tr key={payment.id} className="hover:bg-slate-800/20 transition-all">
                          {/* Receipt Number */}
                          <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                            {payment.receiptNumber || 'N/A'}
                          </td>

                          {/* Payment ID */}
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {payment.id}
                          </td>

                          {/* Loan ID */}
                          <td className="px-6 py-4 font-mono text-slate-400 font-semibold">
                            {payment.loanId}
                          </td>
                          
                          {/* Borrower */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                {payment.borrowerName.charAt(0)}
                              </div>
                              <span className="font-semibold text-white">{payment.borrowerName}</span>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 font-mono text-right text-emerald-400 font-bold">
                            {formatCurrency(payment.amount, assocLoan?.currency)}
                          </td>

                          {/* Method */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300 border border-slate-800">
                              <Landmark size={10} className="text-slate-500 shrink-0" />
                              {payment.method}
                            </span>
                          </td>

                          {/* Payment Date */}
                          <td className="px-6 py-4 text-slate-400 font-mono text-2xs">
                            {payment.paymentDate}
                          </td>

                          {/* Remaining Balance After Payment */}
                          <td className="px-6 py-4 font-mono text-right text-indigo-400 font-semibold">
                            {formatCurrency(payment.remainingBalanceAfter ?? (assocLoan ? assocLoan.remainingAmount : 0), assocLoan?.currency)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenReceipt(payment.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                                title="View Receipt"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(payment)}
                                className="rounded-lg p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 transition-all cursor-pointer"
                                title="Edit Record"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(payment.id, payment.borrowerName, payment.amount)}
                                disabled={deletePaymentMutation.isPending}
                                className="rounded-lg p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
                                title="Reverse Transaction"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. ADD / EDIT VIEW ==================== */}
      {(view === 'add' || view === 'edit') && (
        <div className="max-w-3xl mx-auto space-y-6">
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
                {view === 'add' ? 'Record structured repayment' : 'Modify payment entry'}
              </h1>
              <p className="text-2xs text-slate-400">
                {view === 'add' 
                  ? 'Input loan settlement parameters and register receipts in the Supabase ledger.' 
                  : `Modifying payment entry for ${selectedPaymentId}.`
                }
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={view === 'add' ? handleAddSubmit : handleEditSubmit} className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-md space-y-6">
            
            {/* Form Section: Loan Selection & Client Info */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-indigo-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Debit Account Selection</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Select Loan */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Choose Loan Account <span className="text-indigo-400">*</span>
                  </label>
                  {loans.length === 0 ? (
                    <div className="p-3.5 rounded-lg border border-yellow-500/10 bg-yellow-500/5 text-yellow-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>No loan agreements are registered. You cannot log payments.</span>
                    </div>
                  ) : (
                    <select
                      disabled={view === 'edit'} // Lock loan account during edit to prevent corruption
                      value={loanId}
                      onChange={(e) => {
                        setLoanId(e.target.value);
                        setLoanIdTouched(true);
                      }}
                      onBlur={() => setLoanIdTouched(true)}
                      className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                        view === 'edit' ? 'opacity-60 cursor-not-allowed bg-slate-900 border-slate-800' :
                        loanIdTouched && !isLoanValid
                          ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                      }`}
                    >
                      <option value="">-- Select active loan account --</option>
                      {loans.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.borrowerName} ({l.id}) - {formatCurrency(l.remainingAmount, l.currency)} remaining
                        </option>
                      ))}
                    </select>
                  )}
                  {loanIdTouched && !isLoanValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      Loan account association is required.
                    </p>
                  )}
                </div>

                {/* Borrower Name (Auto-filled read-only) */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Borrower Client Name (Read-Only)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                      <User size={13} />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={selectedLoan ? selectedLoan.borrowerName : 'Select a loan first...'}
                      className="w-full pl-8 pr-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-900 text-slate-400 font-semibold focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Read Only Stats of Selected Loan */}
              {selectedLoan && (
                <div className="space-y-3">
                  {(selectedLoan.remainingAmount <= 0 || selectedLoan.status === 'Completed' || selectedLoan.status === 'Fully Paid') && view === 'add' && (
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2 font-semibold">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>This loan has already been fully paid. No additional payments can be recorded.</span>
                    </div>
                  )}
                  <div className="grid gap-4 grid-cols-2 p-4 rounded-xl border border-slate-800/60 bg-slate-950/40">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Original Loan Principal</span>
                      <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">
                        {formatCurrency(selectedLoan.amount, selectedLoan.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Outstanding Balance</span>
                      <span className="text-sm font-extrabold text-indigo-400 font-mono mt-0.5 block">
                        {formatCurrency(maxAllowed, selectedLoan.currency)}
                      </span>
                      {view === 'edit' && selectedPaymentId && (
                        <span className="text-[9px] text-slate-500 leading-relaxed block mt-1">
                          (Includes original {formatCurrency(payments.find(p => p.id === selectedPaymentId)?.amount ?? 0, selectedLoan.currency)} payment)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Section: Payment Metrics */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Payment parameters</h3>
              
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Payment Amount */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Amount <span className="text-indigo-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none font-mono text-xs">
                      {selectedLoan?.currency === 'BDT' ? '৳' : '$'}
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setAmountTouched(true);
                      }}
                      onBlur={() => setAmountTouched(true)}
                      placeholder="e.g. 5000"
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
                      {amount === '' ? 'Payment amount is required.' : 
                       parseFloat(amount) <= 0 ? 'Amount must be greater than zero.' : 
                       'Payment amount cannot exceed the remaining loan balance.'}
                    </p>
                  )}
                </div>

                {/* Payment Date */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Date <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => {
                      setPaymentDate(e.target.value);
                      setPaymentDateTouched(true);
                    }}
                    onBlur={() => setPaymentDateTouched(true)}
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                      paymentDateTouched && !isPaymentDateValid
                        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                    }`}
                  />
                  {paymentDateTouched && !isPaymentDateValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      Payment Date is required.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Method */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Method
                  </label>
                  <select
                    value={method}
                    onChange={(e: any) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Banking">Mobile Banking</option>
                    <option value="Card">Card / POS</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Reference Number (Optional) */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Reference Number / Txn ID <span className="text-slate-500 text-[9px]">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                      <Hash size={13} />
                    </div>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. TXN9201948"
                      className="w-full pl-8 pr-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional notes section */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">Additional terms</h3>
              
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Notes / Private Remarks</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record bank branch name, depositor signature remarks, payment installment period, or secondary details here..."
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
                disabled={!isFormValid || createPaymentMutation.isPending || updatePaymentMutation.isPending}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all cursor-pointer ${
                  isFormValid && !createPaymentMutation.isPending && !updatePaymentMutation.isPending
                    ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/10' 
                    : 'bg-indigo-900/40 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {(createPaymentMutation.isPending || updatePaymentMutation.isPending) && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                <span>
                  {createPaymentMutation.isPending || updatePaymentMutation.isPending
                    ? 'Processing...'
                    : view === 'add' ? 'Save Payment' : 'Commit Changes'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. RECEIPT / DETAILS VIEW ==================== */}
      {view === 'receipt' && selectedPayment && (
        <PaymentReceipt
          payment={selectedPayment}
          loan={selectedPaymentLoan}
          onBack={() => setView('list')}
        />
      )}

    </div>
  );
}
