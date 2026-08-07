import { useState, FormEvent } from 'react';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  UserCheck, 
  AlertCircle, 
  User, 
  MapPin, 
  Briefcase, 
  FileText, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  FileSignature,
  Receipt
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Borrower, Loan } from '../types';
import { 
  useBorrowersQuery, 
  useCreateBorrowerMutation, 
  useUpdateBorrowerMutation, 
  useDeleteBorrowerMutation,
  useLoansQuery,
  usePaymentsQuery
} from '../hooks/useSupabaseQueries';

type ViewState = 'list' | 'add' | 'edit' | 'profile';

export default function Borrowers() {
  const { formatCurrency } = useApp();
  
  // Real Supabase data via React Query
  const { data: borrowers = [], isLoading, isError, error: fetchError } = useBorrowersQuery();
  const { data: loans = [] } = useLoansQuery();
  const { data: payments = [] } = usePaymentsQuery();
  const createBorrowerMutation = useCreateBorrowerMutation();
  const updateBorrowerMutation = useUpdateBorrowerMutation();
  const deleteBorrowerMutation = useDeleteBorrowerMutation();

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  
  // View navigation state
  const [view, setView] = useState<ViewState>('list');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);
  
  // List controls
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'cleared'>('all');

  // Form inputs state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [notes, setNotes] = useState('');

  // Form touch validation tracker
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Form validations
  const isNameValid = name.trim().length > 0;
  const isPhoneValid = phone.trim().length >= 5; // standard short number validation
  const isFormValid = isNameValid && isPhoneValid;

  // Open "Add Borrower" view
  const handleOpenAdd = () => {
    setName('');
    setPhone('');
    setEmail('');
    setNationalId('');
    setAddress('');
    setOccupation('');
    setNotes('');
    setNameTouched(false);
    setPhoneTouched(false);
    setView('add');
  };

  // Open "Edit Borrower" view
  const handleOpenEdit = (borrower: Borrower) => {
    setSelectedBorrowerId(borrower.id);
    setName(borrower.name);
    setPhone(borrower.phone);
    setEmail(borrower.email === 'No email provided' ? '' : borrower.email);
    setNationalId(borrower.nationalId || '');
    setAddress(borrower.address || '');
    setOccupation(borrower.occupation || '');
    setNotes(borrower.notes || '');
    setNameTouched(false);
    setPhoneTouched(false);
    setView('edit');
  };

  // Open "View Profile" details view
  const handleOpenProfile = (borrowerId: string) => {
    setSelectedBorrowerId(borrowerId);
    setView('profile');
  };

  // Handle Create Submit
  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);

    if (!isFormValid) return;

    createBorrowerMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'No email provided',
      status: 'Active',
      nationalId: nationalId.trim() || undefined,
      address: address.trim() || undefined,
      occupation: occupation.trim() || undefined,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        showToast('Borrower created successfully', 'success');
        setView('list');
      },
      onError: (err: any) => {
        showToast(err?.message || 'Failed to create borrower', 'error');
      }
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);

    if (!isFormValid || !selectedBorrowerId) return;

    updateBorrowerMutation.mutate({
      id: selectedBorrowerId,
      updated: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || 'No email provided',
        nationalId: nationalId.trim() || undefined,
        address: address.trim() || undefined,
        occupation: occupation.trim() || undefined,
        notes: notes.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        showToast('Borrower updated successfully', 'success');
        setView('list');
      },
      onError: (err: any) => {
        showToast(err?.message || 'Failed to update borrower', 'error');
      }
    });
  };

  // Handle Soft Delete
  const handleDelete = (borrowerId: string, name: string) => {
    if (confirm(`Are you sure you want to remove borrower profile: ${name}? This record will be removed from your active list. It will not be permanently erased.`)) {
      deleteBorrowerMutation.mutate(borrowerId, {
        onSuccess: () => {
          showToast('Borrower deleted successfully', 'success');
          if (selectedBorrowerId === borrowerId) {
            setView('list');
          }
        },
        onError: (err: any) => {
          showToast(err?.message || 'Failed to delete borrower', 'error');
        }
      });
    }
  };

  // Filtered borrowers computed list
  const filteredBorrowers = borrowers.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterTab === 'active') {
      return b.status === 'Active' || b.status === 'Overdue';
    }
    if (filterTab === 'cleared') {
      return b.status === 'Cleared';
    }
    return true; // 'all'
  });

  // Calculate dynamic data when showing specific profile
  const selectedBorrower = borrowers.find(b => b.id === selectedBorrowerId);
  const selectedBorrowerLoans = selectedBorrower 
    ? loans.filter(l => l.borrowerId === selectedBorrower.id)
    : [];

  const totalLoansCount = selectedBorrowerLoans.length;
  const totalAmountLent = selectedBorrowerLoans.reduce((sum, l) => sum + l.amount, 0);
  const pendingAmountValue = selectedBorrowerLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalAmountReceived = totalAmountLent - pendingAmountValue;

  // Currency helper
  const formatLoanCurrency = (val: number, currencyCode?: string) => {
    return formatCurrency(val, currencyCode);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="borrowers-view">
      
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
        <>
          {/* Header section */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Borrower Management
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Maintain comprehensive profiles, trace active balance cards, and dispatch legal notices.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
              id="btn-add-borrower"
            >
              <UserPlus size={14} />
              <span>Add Borrower</span>
            </button>
          </div>

          {/* Search, Filter Tabs and Analytics Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-sm">
            {/* Search inputs */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search borrower by name or phone..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-950 text-white transition-all"
                id="borrower-search-input"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Borrowers ({borrowers.length})
              </button>
              <button
                onClick={() => setFilterTab('active')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                  filterTab === 'active'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({borrowers.filter(b => b.status === 'Active' || b.status === 'Overdue').length})
              </button>
              <button
                onClick={() => setFilterTab('cleared')}
                className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all cursor-pointer ${
                  filterTab === 'cleared'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cleared ({borrowers.filter(b => b.status === 'Cleared').length})
              </button>
            </div>
          </div>

          {/* Borrowers Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center" id="borrowers-loading-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-indigo-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                </div>
                <h3 className="mt-4 text-xs font-semibold text-slate-300">Loading borrowers from database...</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  Please wait while we establish a connection and retrieve the ledger record.
                </p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-rose-400" id="borrowers-error-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
                  <AlertCircle size={22} />
                </div>
                <h3 className="mt-2 text-xs font-semibold">Failed to load borrowers</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  {fetchError?.message || 'Please check your connection and try again.'}
                </p>
              </div>
            ) : filteredBorrowers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center" id="borrowers-empty-state">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/40 text-slate-500">
                  <UserPlus size={22} className="stroke-1" />
                </div>
                <h3 className="mt-4 text-xs font-semibold text-slate-300">No matching borrowers found</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  Try adjusting your keywords or register a brand new borrower above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3.5">Borrower Profile</th>
                      <th className="px-6 py-3.5">Phone Number</th>
                      <th className="px-6 py-3.5 text-center">Total Loans</th>
                      <th className="px-6 py-3.5 text-right">Pending Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Joined Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                    {filteredBorrowers.map((borrower) => {
                      // Initial for Avatar
                      const initials = borrower.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'B';
                      
                      return (
                        <tr key={borrower.id} className="hover:bg-slate-800/30 transition-all">
                          {/* Profile & Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 text-xs shadow-inner">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-white hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => handleOpenProfile(borrower.id)}>
                                  {borrower.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[170px]">
                                  {borrower.occupation || 'No occupation listed'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {borrower.phone}
                          </td>

                          {/* Total Loans */}
                          <td className="px-6 py-4 text-center font-semibold text-white">
                            {borrower.totalLoans}
                          </td>

                          {/* Pending Balance */}
                          <td className="px-6 py-4 text-right font-mono text-indigo-400 font-semibold">
                            {formatCurrency(borrower.pendingAmount)}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                                borrower.status === 'Overdue'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : borrower.status === 'Cleared'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {borrower.status}
                            </span>
                          </td>

                          {/* Created Date */}
                          <td className="px-6 py-4 text-slate-500 font-mono text-2xs">
                            {borrower.joinedDate}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenProfile(borrower.id)}
                                className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer hover:text-indigo-300"
                                title="View Profile"
                              >
                                <User size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(borrower)}
                                className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-950/20 transition-all cursor-pointer hover:text-indigo-300"
                                title="Edit Details"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(borrower.id, borrower.name)}
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-950/20 transition-all cursor-pointer hover:text-rose-400"
                                title="Delete Borrower"
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
        </>
      )}

      {/* ==================== 2. ADD / EDIT BORROWER FORM VIEW ==================== */}
      {(view === 'add' || view === 'edit') && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header / Nav back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#18181b] text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                {view === 'add' ? 'Register New Borrower' : 'Edit Borrower Card'}
              </h1>
              <p className="text-2xs text-slate-400">
                {view === 'add' ? 'Initiate a new client identity in Amanah ledger record.' : `Update records for Borrower ID: ${selectedBorrowerId}`}
              </p>
            </div>
          </div>

          <form onSubmit={view === 'add' ? handleAddSubmit : handleEditSubmit} className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-6">
            
            {/* Required Fields Section */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1">Required Information</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameTouched(true);
                    }}
                    placeholder="e.g. Salim Al-Harthy"
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                      nameTouched && !isNameValid 
                        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500' 
                        : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                    }`}
                  />
                  {nameTouched && !isNameValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      Full name is required.
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Phone Number <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneTouched(true);
                    }}
                    placeholder="e.g. +968 9123 4567"
                    className={`w-full px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-slate-950 text-white ${
                      phoneTouched && !isPhoneValid 
                        ? 'border-rose-500/50 focus:ring-rose-500/20 focus:border-rose-500' 
                        : 'border-slate-800 focus:ring-indigo-500/15 focus:border-indigo-600'
                    }`}
                  />
                  {phoneTouched && !isPhoneValid && (
                    <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      A valid phone number is required.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="space-y-4">
              <h3 className="text-2xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Demographics & Identity</h3>
              
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Email */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. salim@company.com"
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  />
                </div>

                {/* National ID */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">National ID / Resident Card</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. 10239482"
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Occupation / Enterprise</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Agricultural Logistics"
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Physical Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, Villa/Apartment Number, Governorate, Country"
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white resize-none font-sans"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Internal Ledger Notes / Terms</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add details regarding custom installment preferences, guarantor context, or general credibility feedback..."
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white resize-none font-sans"
                />
              </div>
            </div>

            {/* Form Actions CTA */}
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
                {view === 'add' ? 'Save Borrower' : 'Commit Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. BORROWER PROFILE DETAILS VIEW ==================== */}
      {view === 'profile' && selectedBorrower && (
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#18181b] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                  {selectedBorrower.name}
                  <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {selectedBorrower.id}
                  </span>
                </h1>
                <p className="text-2xs text-slate-400">
                  Established profile ledger on: <span className="font-mono text-white">{selectedBorrower.joinedDate}</span>
                </p>
              </div>
            </div>

            {/* Profile CTAs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEdit(selectedBorrower)}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#18181b] hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => handleDelete(selectedBorrower.id, selectedBorrower.name)}
                className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-semibold text-rose-400 transition-all cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete Borrower</span>
              </button>
            </div>
          </div>

          {/* Profile Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* 1. Left Hand Column - Personal Information Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-6">
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-800/80">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 text-xl shadow-lg mb-3">
                    {selectedBorrower.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'B'}
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedBorrower.name}</h3>
                  <p className="text-2xs text-slate-400 mt-0.5">{selectedBorrower.occupation || 'No occupation listed'}</p>
                  
                  {/* Status Badge */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-0.5 text-[9px] font-bold tracking-wide uppercase ${
                        selectedBorrower.status === 'Overdue'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                          : selectedBorrower.status === 'Cleared'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {selectedBorrower.status} Status
                    </span>
                  </div>
                </div>

                {/* Personal Information Details */}
                <div className="space-y-4 text-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bio Parameters</h4>
                  
                  {/* Phone */}
                  <div className="flex items-start gap-2.5">
                    <Phone size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">Phone Contact</p>
                      <p className="font-mono text-white mt-0.5">{selectedBorrower.phone}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-2.5">
                    <Mail size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">Email Address</p>
                      <p className="text-white mt-0.5 break-all">{selectedBorrower.email}</p>
                    </div>
                  </div>

                  {/* National ID */}
                  <div className="flex items-start gap-2.5">
                    <User size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">National ID / Resident Code</p>
                      <p className="font-mono text-white mt-0.5">{selectedBorrower.nationalId || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="flex items-start gap-2.5">
                    <Briefcase size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">Occupation / Business</p>
                      <p className="text-white mt-0.5">{selectedBorrower.occupation || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2.5 border-t border-slate-800/50 pt-3">
                    <MapPin size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">Registered Residence Address</p>
                      <p className="text-slate-300 mt-1 leading-relaxed text-[11px] whitespace-pre-wrap">
                        {selectedBorrower.address || 'No registered address on record.'}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="flex items-start gap-2.5 border-t border-slate-800/50 pt-3">
                    <FileText size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-500">Private Admin Notes</p>
                      <p className="text-slate-400 mt-1 leading-relaxed text-[11px] whitespace-pre-wrap italic">
                        {selectedBorrower.notes || 'No private notes registered.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Right Hand Column - Financial Summaries & Loan History */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Loan Summary Cards Section */}
              <div className="grid gap-4 sm:grid-cols-4">
                {/* Card 1: Total Loans count */}
                <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Loans</p>
                  <p className="text-xl font-extrabold text-white mt-2 font-mono">{totalLoansCount}</p>
                  <p className="text-[9px] text-slate-500 mt-1">Advances registered</p>
                </div>

                {/* Card 2: Total Amount Lent */}
                <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Lent</p>
                  <p className="text-xl font-extrabold text-indigo-400 mt-2 font-mono">
                    {formatCurrency(totalAmountLent)}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Principal aggregate</p>
                </div>

                {/* Card 3: Total Amount Received */}
                <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-2 font-mono">
                    {formatCurrency(totalAmountReceived)}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Settle repayments</p>
                </div>

                {/* Card 4: Pending Amount */}
                <div className="rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Balance</p>
                  <p className="text-xl font-extrabold text-rose-400 mt-2 font-mono">
                    {formatCurrency(pendingAmountValue)}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-1">Unsecured balance</p>
                </div>
              </div>

              {/* Associated Loan History Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Amanah Credit Loan History</h3>
                  <span className="text-[10px] text-slate-400">Showing active and closed contracts</span>
                </div>

                {selectedBorrowerLoans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <FileSignature size={20} className="text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">No loan agreements established</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">This client is not currently associated with any active advances.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/10 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">Loan ID</th>
                          <th className="py-3 px-3 text-right">Amount</th>
                          <th className="py-3 px-3">Purpose / Notes</th>
                          <th className="py-3 px-3">Issue Date</th>
                          <th className="py-3 px-3">Due Date</th>
                          <th className="py-3 px-3 text-right">Remaining</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                        {selectedBorrowerLoans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-slate-800/20 transition-all">
                            <td className="py-3 px-3 font-mono font-semibold text-slate-400">{loan.id}</td>
                            <td className="py-3 px-3 text-right text-white font-mono">
                              {formatLoanCurrency(loan.amount, loan.currency)}
                            </td>
                            <td className="py-3 px-3 max-w-[150px] truncate" title={loan.purpose}>{loan.purpose}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-2xs">{loan.loanDate}</td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-2xs">{loan.dueDate}</td>
                            <td className="py-3 px-3 text-right font-mono text-indigo-400">
                              {formatLoanCurrency(loan.remainingAmount, loan.currency)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                                  loan.status === 'Overdue'
                                    ? 'bg-rose-500/10 text-rose-400'
                                    : loan.status === 'Fully Paid'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
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

              {/* Borrower Payment History Section */}
              <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Repayment Logs & Recent Payments</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Chronological audit trail of client loan repayments</p>
                  </div>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                    {payments.filter(p => {
                      const isMatch = selectedBorrowerLoans.some(l => l.id === p.loanId) || p.borrowerName.toLowerCase() === selectedBorrower.name.toLowerCase();
                      return isMatch;
                    }).length} Total Payments
                  </span>
                </div>

                {payments.filter(p => {
                  const isMatch = selectedBorrowerLoans.some(l => l.id === p.loanId) || p.borrowerName.toLowerCase() === selectedBorrower.name.toLowerCase();
                  return isMatch;
                }).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <Receipt size={20} className="text-slate-600 mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-400">No payment history recorded</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">This client has not logged any repayments in our ledger yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/10 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">Payment ID</th>
                          <th className="py-3 px-3">Loan ID</th>
                          <th className="py-3 px-3 text-right">Amount Paid</th>
                          <th className="py-3 px-3">Method</th>
                          <th className="py-3 px-3">Payment Date</th>
                          <th className="py-3 px-3 text-right">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-[11px] text-slate-300">
                        {payments.filter(p => {
                          const isMatch = selectedBorrowerLoans.some(l => l.id === p.loanId) || p.borrowerName.toLowerCase() === selectedBorrower.name.toLowerCase();
                          return isMatch;
                        }).map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-800/20 transition-all">
                            <td className="py-3 px-3 font-mono font-semibold text-emerald-400">{payment.id}</td>
                            <td className="py-3 px-3 font-mono text-slate-400">{payment.loanId}</td>
                            <td className="py-3 px-3 text-right text-white font-mono font-bold">
                              {formatLoanCurrency(payment.amount)}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex rounded-md bg-slate-800 px-2 py-0.5 text-[8px] font-bold uppercase text-slate-300">
                                {payment.method}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-2xs">{payment.paymentDate}</td>
                            <td className="py-3 px-3 text-right font-mono text-indigo-400">
                              {formatLoanCurrency(payment.remainingBalanceAfter ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
