import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  FileText, 
  Scale, 
  Eye, 
  Download, 
  Printer, 
  Check, 
  AlertCircle, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Agreement, Loan } from '../types';
import { useLoansQuery, useBorrowersQuery, useAgreementsQuery, QUERY_KEYS } from '../hooks/useSupabaseQueries';
import { AgreementService } from '../services/AgreementService';
import { generateAgreementPDF, downloadAgreementWithAI } from '../utils/pdfGenerator';
import AgreementDetails from './AgreementDetails';

export default function Agreements() {
  const { 
    formatCurrency: formatCurrencyFromContext
  } = useApp();
  
  const queryClient = useQueryClient();
  const { data: agreements = [] } = useAgreementsQuery();
  const { data: loans = [] } = useLoansQuery();
  const { data: borrowers = [] } = useBorrowersQuery();

  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params for deep-linking
  const paramId = searchParams.get('id');

  // Views: 'list' | 'details'
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Latest' | 'Archived'>('All');

  // Loading state for missing agreement auto-generation
  const [generatingLoanId, setGeneratingLoanId] = useState<string | null>(null);
  const [downloadingAgrId, setDownloadingAgrId] = useState<string | null>(null);

  // Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Sync URL parameters to component view state
  useEffect(() => {
    if (paramId) {
      setSelectedAgreementId(paramId);
      setView('details');
    } else {
      setView('list');
      setSelectedAgreementId(null);
    }
  }, [paramId]);

  // Handle generating missing agreement for legacy / fallback loan
  const handleGenerateMissingAgreement = async (loan: Loan) => {
    setGeneratingLoanId(loan.id);
    try {
      const borrowerName = borrowers.find(b => b.id === loan.borrowerId)?.name || loan.borrowerName || 'Unknown Borrower';
      console.log('[Agreements] Requesting agreement auto-generation for loan:', loan.id);
      
      const created = await AgreementService.autoGenerateForLoan({
        id: loan.id,
        borrowerId: loan.borrowerId,
        borrowerName,
        amount: loan.amount,
        purpose: loan.purpose,
        loanDate: loan.loanDate,
        dueDate: loan.dueDate,
      });

      console.log('[Agreements] Agreement auto-generation result:', created);

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements, refetchType: 'all' });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });

      if (created) {
        triggerToast(`Agreement ${created.agreementNumber || created.id} generated for Loan ${loan.id}!`, 'success');
      } else {
        triggerToast(`Notice: Agreement already exists or could not be generated.`, 'info');
      }
    } catch (err: any) {
      console.error('[Agreements] Error generating missing agreement:', err);
      triggerToast(`Error generating missing agreement: ${err?.message || 'Database error'}`, 'error');
    } finally {
      setGeneratingLoanId(null);
    }
  };

  // Handle PDF Download directly from table list using AI generation
  const handleDownloadPDF = async (agr: Agreement) => {
    setDownloadingAgrId(agr.id);
    try {
      triggerToast(`Generating AI legal document for download...`, 'info');
      const details = await AgreementService.getAgreementDetails(agr.id);
      if (details) {
        await downloadAgreementWithAI(details);
        triggerToast(`Agreement document downloaded successfully!`, 'success');
      } else {
        triggerToast(`Could not load agreement details for PDF generation.`, 'error');
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      triggerToast(`Failed to generate PDF document: ${err?.message || 'Download error'}`, 'error');
    } finally {
      setDownloadingAgrId(null);
    }
  };

  // Find loans that do not currently have an agreement (Edge case fallback)
  const loansMissingAgreement = loans.filter(
    (loan) => !agreements.some((agr) => agr.loanId === loan.id)
  );

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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border bg-[#161619] p-4 shadow-2xl animate-fade-in-up ${
          toast.type === 'error'
            ? 'border-rose-500/40 text-rose-400'
            : toast.type === 'info'
            ? 'border-indigo-500/40 text-indigo-400'
            : 'border-emerald-500/40 text-emerald-400'
        }`}>
          <div className={`rounded-xl p-2 ${
            toast.type === 'error'
              ? 'bg-rose-500/10 text-rose-400'
              : toast.type === 'info'
              ? 'bg-indigo-500/10 text-indigo-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle size={18} />
            ) : toast.type === 'info' ? (
              <AlertCircle size={18} />
            ) : (
              <Check size={18} />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              {toast.type === 'error'
                ? 'Action Failed'
                : toast.type === 'info'
                ? 'Notice'
                : 'Action Confirmed'}
            </p>
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
                View, manage, and download legal repayment covenants automatically generated for issued loans.
              </p>
            </div>
          </div>

          {/* MISSING AGREEMENT FALLBACK BANNER (Edge Case) */}
          {loansMissingAgreement.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertCircle size={16} />
                <span>Missing Agreements Detected ({loansMissingAgreement.length} Loan{loansMissingAgreement.length > 1 ? 's' : ''})</span>
              </div>
              <p className="text-2xs text-amber-200/80">
                The following loans do not have an agreement generated yet. Click "Generate Agreement" to create one:
              </p>
              <div className="space-y-2">
                {loansMissingAgreement.map((loan) => {
                  const bName = borrowers.find(b => b.id === loan.borrowerId)?.name || 'Unknown Borrower';
                  return (
                    <div key={loan.id} className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-amber-500/20 text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-400">{loan.id}</span>
                        <span className="text-slate-300 ml-2">• Borrower: <strong>{bName}</strong></span>
                        <span className="text-slate-400 ml-2">• Amount: {formatCurrency(loan.amount, loan.currency)}</span>
                      </div>
                      <button
                        onClick={() => handleGenerateMissingAgreement(loan)}
                        disabled={generatingLoanId === loan.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {generatingLoanId === loan.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>Generate Agreement</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                  No agreements match your search or filter configuration. New loans automatically generate agreements.
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
                              agr.status === 'Active' || agr.status === 'Signed' || agr.status === 'Completed'
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
                              onClick={() => handleDownloadPDF(agr)}
                              disabled={downloadingAgrId === agr.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/30 px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition-all disabled:opacity-50"
                              title="Download PDF"
                            >
                              {downloadingAgrId === agr.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Download size={11} />
                              )}
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => setSearchParams({ id: agr.id })}
                              className="rounded-lg border border-slate-800 bg-slate-900/30 p-1 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              title="Print Document"
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

      {/* VIEW: AGREEMENT DETAILS */}
      {view === 'details' && (selectedAgreementId || paramId) && (
        <AgreementDetails
          agreementId={selectedAgreementId || paramId!}
          onBack={() => setSearchParams({})}
        />
      )}

    </div>
  );
}
