import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  Scale, 
  Eye, 
  Download, 
  Printer, 
  ArrowLeft, 
  History, 
  Edit3, 
  UserCheck, 
  ShieldCheck, 
  Check, 
  Plus, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  FileSignature, 
  Clock,
  Briefcase,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Agreement, AgreementVersion } from '../types';
import { useLoansQuery, useBorrowersQuery, useAgreementsQuery } from '../hooks/useSupabaseQueries';
import AgreementDetails from './AgreementDetails';

export default function Agreements() {
  const { 
    addAgreement, 
    updateAgreement, 
    restoreAgreementVersion,
    formatCurrency: formatCurrencyFromContext
  } = useApp();
  
  const { data: agreements = [] } = useAgreementsQuery();
  const { data: loans = [] } = useLoansQuery();
  const { data: borrowers = [] } = useBorrowersQuery();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read URL params for deep-linking
  const paramId = searchParams.get('id');
  const paramAction = searchParams.get('action');
  const paramLoanId = searchParams.get('loanId');

  // Views: 'list' | 'create' | 'details'
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Latest' | 'Archived'>('All');

  // Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Creation form states
  const [formAgreementId, setFormAgreementId] = useState('');
  const [formBorrowerId, setFormBorrowerId] = useState('');
  const [formLoanId, setFormLoanId] = useState('');
  const [formWitnessName, setFormWitnessName] = useState('');
  const [formWitnessPhone, setFormWitnessPhone] = useState('');
  const [formStatus, setFormStatus] = useState<Agreement['status']>('Pending');

  // Edit form states
  const [isEditing, setIsEditing] = useState(false);
  const [editPurpose, setEditPurpose] = useState('');
  const [editLoanAmount, setEditLoanAmount] = useState('');
  const [editWitnessName, setEditWitnessName] = useState('');
  const [editWitnessPhone, setEditWitnessPhone] = useState('');
  const [editStatus, setEditStatus] = useState<Agreement['status']>('Pending');
  const [editCreateNewVersion, setEditCreateNewVersion] = useState(false);

  // Historical version viewer modal
  const [historicalVersionPreview, setHistoricalVersionPreview] = useState<AgreementVersion | null>(null);

  // Sync URL parameters to component view state
  useEffect(() => {
    if (paramId) {
      setSelectedAgreementId(paramId);
      setView('details');
      setIsEditing(false);
    } else if (paramAction === 'create') {
      setView('create');
      // Auto-generate fresh ID
      setFormAgreementId(`AGR-${Math.floor(1000 + Math.random() * 9000)}`);
      if (paramLoanId) {
        const ln = loans.find(l => l.id === paramLoanId);
        if (ln) {
          setFormBorrowerId(ln.borrowerId);
          setFormLoanId(ln.id);
        }
      } else {
        setFormBorrowerId('');
        setFormLoanId('');
      }
      setFormWitnessName('');
      setFormWitnessPhone('');
      setFormStatus('Pending');
    } else {
      setView('list');
      setSelectedAgreementId(null);
    }
  }, [paramId, paramAction, paramLoanId, agreements, loans]);

  // Handle Create Submit
  const handleCreateAgreement = (e: FormEvent) => {
    e.preventDefault();
    const ln = loans.find(l => l.id === formLoanId);
    const brw = borrowers.find(b => b.id === formBorrowerId);

    if (!ln || !brw) {
      triggerToast('Error: Invalid loan or borrower selected.', 'info');
      return;
    }

    // Every Loan must have one agreement check:
    const alreadyHas = agreements.some(a => a.loanId === formLoanId);
    if (alreadyHas) {
      triggerToast(`Notice: A deed agreement already exists for Loan ${formLoanId}.`, 'info');
    }

    addAgreement({
      loanId: ln.id,
      borrowerId: brw.id,
      borrowerName: brw.name,
      loanAmount: ln.amount,
      purpose: ln.purpose,
      loanDate: ln.loanDate,
      dueDate: ln.dueDate,
      witnessName: formWitnessName || undefined,
      witnessPhone: formWitnessPhone || undefined,
      status: formStatus,
    });

    triggerToast(`Deed Agreement generated successfully with number ${formAgreementId}!`);
    // Clear URL and return to list
    setSearchParams({});
  };

  // Handle Edit Submit
  const handleEditAgreement = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAgreementId) return;

    updateAgreement(
      selectedAgreementId,
      {
        purpose: editPurpose,
        loanAmount: parseFloat(editLoanAmount) || 0,
        witnessName: editWitnessName || undefined,
        witnessPhone: editWitnessPhone || undefined,
        status: editStatus,
      },
      editCreateNewVersion
    );

    triggerToast(
      editCreateNewVersion 
        ? 'Successfully committed new version & updated active agreement!' 
        : 'Agreement details updated in-place successfully!'
    );

    setIsEditing(false);
  };

  // Populate Edit states when toggling Edit form
  const startEditing = (agr: Agreement) => {
    setEditPurpose(agr.purpose);
    setEditLoanAmount(agr.loanAmount.toString());
    setEditWitnessName(agr.witnessName || '');
    setEditWitnessPhone(agr.witnessPhone || '');
    setEditStatus(agr.status);
    setEditCreateNewVersion(true); // Default to bumping version for safety
    setIsEditing(true);
  };

  // Handle Restore Version
  const handleRestoreVersion = (versionStr: string) => {
    if (!selectedAgreementId) return;
    restoreAgreementVersion(selectedAgreementId, versionStr);
    triggerToast(`Agreement rolled back and restored to version ${versionStr}!`);
  };

  // Fetch data
  const activeAgreement = agreements.find(a => a.id === selectedAgreementId);
  const selectedBorrowerLoans = loans.filter(l => l.borrowerId === formBorrowerId);
  const chosenLoan = loans.find(l => l.id === formLoanId);

  // Filtering list
  const filteredAgreements = agreements.filter(a => {
    // Search
    const matchesSearch = 
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.agreementNumber && a.agreementNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.loanId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Tabs filter
    if (filterType === 'Latest') {
      return a.status !== 'Archived';
    }
    if (filterType === 'Archived') {
      return a.status === 'Archived';
    }
    return true; // All
  });

  const formatCurrency = (val: number, currency?: string) => {
    return formatCurrencyFromContext(val, currency);
  };

  return (
    <div className="space-y-6" id="agreements-management-module">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#161619] p-4 shadow-2xl animate-fade-in-up">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <Check size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Action Confirmed</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}

      {/* VIEW: AGREEMENTS LIST */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Scale className="text-indigo-500 stroke-2" size={24} />
                <span>Agreement Management</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Draft legal covenants, trace revisions, and enforce compliant repayment terms.
              </p>
            </div>
            <button
              onClick={() => setSearchParams({ action: 'create' })}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 cursor-pointer"
              id="btn-nav-generate-agreement"
            >
              <Plus size={14} />
              <span>Generate Agreement</span>
            </button>
          </div>

          {/* Search, Filters & Actions bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-800 bg-[#18181b] p-4 shadow-sm">
            {/* Search */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by agreement #, borrower, or loan ID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-950 text-white transition-all"
                id="agreement-main-search"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              {(['All', 'Latest', 'Archived'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-bold transition-all cursor-pointer ${
                    filterType === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'Latest' ? 'Latest Version' : tab === 'Archived' ? 'Archived Versions' : 'All Agreements'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] shadow-sm overflow-hidden">
            {filteredAgreements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center" id="agreements-list-empty">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/50 text-slate-500 border border-slate-800">
                  <FileText size={22} className="stroke-1 text-slate-400" />
                </div>
                <h3 className="mt-4 text-xs font-semibold text-slate-300">No covenants archived</h3>
                <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                  No agreements match your search or filter configuration. Click Generate Agreement to establish legal terms.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/30 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Agreement Number</th>
                      <th className="px-6 py-4">Borrower</th>
                      <th className="px-6 py-4">Loan ID</th>
                      <th className="px-6 py-4 text-right">Loan Amount</th>
                      <th className="px-6 py-4 text-center">Version</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-2xs text-slate-300">
                    {filteredAgreements.map((agr) => {
                      const associatedLoan = loans.find(l => l.id === agr.loanId);
                      const currencyStr = associatedLoan?.currency || 'USD';

                      return (
                        <tr key={agr.id} className="hover:bg-slate-800/10 transition-all">
                          <td className="px-6 py-4 font-mono font-bold text-emerald-400">{agr.agreementNumber || agr.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-white">{agr.borrowerName}</p>
                          </td>
                          <td className="px-6 py-4 font-mono text-indigo-400 font-semibold">{agr.loanId}</td>
                          <td className="px-6 py-4 text-right font-mono text-white font-bold">
                            {formatCurrency(agr.loanAmount, currencyStr)}
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-semibold text-indigo-400">
                            {agr.version}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold uppercase border ${
                              agr.status === 'Active' || agr.status === 'Signed'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : agr.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : agr.status === 'Draft'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              {agr.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-400">{agr.createdDate}</td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSearchParams({ id: agr.id })}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                              title="View Document Details"
                            >
                              <Eye size={11} />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={() => triggerToast(`Assembling file download stream for ${agr.id}_compliance_agreement.pdf`)}
                              className="rounded-lg border border-slate-800 bg-slate-900/30 p-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Download PDF (Mock)"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => triggerToast(`Generating printable layout for agreement ${agr.id}...`)}
                              className="rounded-lg border border-slate-800 bg-slate-900/30 p-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Print Agreement"
                            >
                              <Printer size={12} />
                            </button>
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

      {/* VIEW: GENERATE AGREEMENT */}
      {view === 'create' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchParams({})}
              className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:text-white hover:bg-[#18181b] transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Generate compliance deed agreement</h1>
              <p className="text-2xs text-slate-400">Establish a legal contract linking a registered borrower and their issued loan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <form onSubmit={handleCreateAgreement} className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#18181b] p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Deed Details form</span>
                <span className="font-mono text-2xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25">
                  {formAgreementId}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Borrower Select */}
                <div className="space-y-1.5">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Borrower</label>
                  <select
                    required
                    value={formBorrowerId}
                    onChange={(e) => {
                      setFormBorrowerId(e.target.value);
                      setFormLoanId(''); // Reset loan select on borrower change
                    }}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  >
                    <option value="">-- Choose registered borrower --</option>
                    {borrowers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Linked Loan Select */}
                <div className="space-y-1.5">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Linked Loan ID</label>
                  <select
                    required
                    disabled={!formBorrowerId}
                    value={formLoanId}
                    onChange={(e) => setFormLoanId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select outstanding loan --</option>
                    {selectedBorrowerLoans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} - {formatCurrency(l.amount, l.currency || 'USD')} ({l.purpose})
                      </option>
                    ))}
                  </select>
                  {!formBorrowerId && (
                    <p className="text-[10px] text-slate-500 italic">Select a borrower first to view loans.</p>
                  )}
                </div>
              </div>

              {/* Read-Only Pre-populated Loan Information Section */}
              {chosenLoan && (
                <div className="rounded-xl border border-indigo-500/15 bg-indigo-500/5 p-4 space-y-3 animate-fade-in text-xs">
                  <h4 className="font-bold text-white text-2xs uppercase tracking-wider flex items-center gap-1.5">
                    <Info size={12} className="text-indigo-400" />
                    <span>Auto-Retrieved Loan Details</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-300">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500">Loan Amount</p>
                      <p className="font-mono text-white font-bold">{formatCurrency(chosenLoan.amount, chosenLoan.currency)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500">Loan Issue Date</p>
                      <p className="font-mono text-white">{chosenLoan.loanDate}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500">Maturity Due Date</p>
                      <p className="font-mono text-white">{chosenLoan.dueDate}</p>
                    </div>
                    <div className="space-y-0.5 col-span-2 sm:col-span-1">
                      <p className="text-[10px] text-slate-500">Purpose</p>
                      <p className="text-slate-200 line-clamp-1">{chosenLoan.purpose}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Witness Section (Optional) */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Witness credentials (Optional)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Witness Full Name</label>
                    <input
                      type="text"
                      value={formWitnessName}
                      onChange={(e) => setFormWitnessName(e.target.value)}
                      placeholder="e.g. Salim Al-Rawahi"
                      className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Witness Contact Phone</label>
                    <input
                      type="text"
                      value={formWitnessPhone}
                      onChange={(e) => setFormWitnessPhone(e.target.value)}
                      placeholder="e.g. +968 9333 4444"
                      className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Status Select */}
              <div className="border-t border-slate-800 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Agreement Initial Status</label>
                  <select
                    required
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Agreement['status'])}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 bg-slate-950 text-white"
                  >
                    <option value="Pending">Pending Signature</option>
                    <option value="Draft">Draft Outline</option>
                    <option value="Signed">Signed & Executed</option>
                  </select>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="px-4 py-2.5 text-2xs font-bold text-slate-400 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-2xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Scale size={13} />
                  <span>Generate Agreement</span>
                </button>
              </div>
            </form>

            {/* Quick Helper Column */}
            <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 space-y-4 text-xs shadow-sm h-fit">
              <h3 className="font-bold text-white uppercase text-2xs tracking-wider pb-2 border-b border-slate-800/60">Instructions</h3>
              <ul className="space-y-2.5 text-slate-400 list-disc pl-4 leading-relaxed">
                <li>Every single Loan disbursed in the Amanah system is strongly required to be bound to exactly one <strong>compliance deed covenant</strong>.</li>
                <li>Choosing a borrower from the dropdown automatically extracts all associated outstanding loan instances.</li>
                <li>Once a loan is selected, key variables such as Amount, Disbursal Date, Maturity, and Purpose are extracted to populate standard legal clauses.</li>
                <li>The newly created contract will initialize at <strong>Version 1.0</strong>. Any modifications made downstream can create audit trail versions automatically.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: AGREEMENT DETAILS */}
      {view === 'details' && (selectedAgreementId || paramId) && (
        <AgreementDetails
          agreementId={selectedAgreementId || paramId!}
          onBack={() => setSearchParams({})}
        />
      )}


      {/* MODAL: HISTORICAL VERSION DOCUMENT VIEWER */}
      {historicalVersionPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-[#18181b] rounded-2xl p-6 shadow-2xl border border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <History size={18} />
                <h3 className="text-base font-bold text-white">
                  Historical Version Viewer: {historicalVersionPreview.version}
                </h3>
              </div>
              <button
                onClick={() => setHistoricalVersionPreview(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1 rounded hover:bg-slate-800 transition-all"
              >
                Close Viewer
              </button>
            </div>

            {/* Document body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-[#fbfbfa] text-slate-850 rounded-xl font-serif text-2xs leading-relaxed space-y-5 border border-slate-300">
              <div className="text-center space-y-1 pb-2 border-b border-slate-200">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">DEBT REPAYMENT AGREEMENT</h4>
                <p className="text-[8px] font-sans font-bold text-slate-400 uppercase tracking-widest">HISTORICAL REVISION RECORD • {historicalVersionPreview.version}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-sans text-[9px] p-2 bg-slate-100 rounded border border-slate-200 text-slate-700">
                <div>Version: <strong>{historicalVersionPreview.version}</strong></div>
                <div>Status: <strong className="uppercase">{historicalVersionPreview.status}</strong></div>
                <div>Created Date: <strong>{historicalVersionPreview.createdDate}</strong></div>
                <div>Created By: <strong className="text-green-600 dark:text-green-400">{historicalVersionPreview.createdBy}</strong></div>
              </div>

              <p className="text-slate-700">
                This historical copy represents the outline of agreement principal, registered on <strong>{historicalVersionPreview.createdDate}</strong> and formulated by administrator <strong className="text-green-600 dark:text-green-400">{historicalVersionPreview.createdBy}</strong>.
              </p>

              <div className="space-y-1">
                <h5 className="font-sans font-bold text-slate-800 text-[9px] uppercase">1. Received Amount</h5>
                <p className="text-slate-600">The historical document declared capital value of <strong>{formatCurrency(historicalVersionPreview.loanAmount)}</strong> under the purpose description of <em>"{historicalVersionPreview.purpose}"</em>.</p>
              </div>

              <div className="space-y-1">
                <h5 className="font-sans font-bold text-slate-800 text-[9px] uppercase">2. Terms & Maturity</h5>
                <p className="text-slate-600">This version bound the settlement obligations to a issue date of <strong>{historicalVersionPreview.loanDate}</strong> and maturity due date of <strong>{historicalVersionPreview.dueDate}</strong>.</p>
              </div>

              {historicalVersionPreview.witnessName && (
                <div className="space-y-1">
                  <h5 className="font-sans font-bold text-slate-800 text-[9px] uppercase">3. Assigned Witness</h5>
                  <p className="text-slate-600">Attested in the presence of witness <strong>{historicalVersionPreview.witnessName}</strong> (Contact: {historicalVersionPreview.witnessPhone}).</p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 text-[8px] text-slate-400 text-center font-sans">
                Immutable Snapshot - Archival Records Only
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => {
                  handleRestoreVersion(historicalVersionPreview.version);
                  setHistoricalVersionPreview(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-2xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg cursor-pointer"
              >
                <Clock size={12} />
                <span>Restore This Version to Active</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
