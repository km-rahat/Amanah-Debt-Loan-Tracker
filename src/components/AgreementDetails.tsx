import { useState } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSignature,
  Building,
  User,
  CreditCard,
  DollarSign,
  Phone,
  Mail,
  Hash,
  Scale,
  ShieldCheck,
  Lock,
  FileText
} from 'lucide-react';
import { useAgreementDetailsQuery } from '../hooks/useSupabaseQueries';
import { useApp } from '../context/AppContext';

interface AgreementDetailsProps {
  agreementId: string;
  onBack?: () => void;
}

export default function AgreementDetails({ agreementId, onBack }: AgreementDetailsProps) {
  const { formatCurrency: formatCurrencyFromContext } = useApp();
  // Load agreement using AgreementService only via React Query
  const { data, isLoading, isError, error } = useAgreementDetailsQuery(agreementId);

  // View state: 'document' (Printable document layout) or 'cards' (Dashboard cards)
  const [activeTab, setActiveTab] = useState<'document' | 'cards'>('document');

  // Currency formatter helper
  const formatCurrency = (val: number, curr?: string) => {
    return formatCurrencyFromContext(val, curr);
  };

  // 1. Show Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-800" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded bg-slate-800" />
            <div className="h-3 w-32 rounded bg-slate-850" />
          </div>
        </div>
        <div className="h-[700px] w-full rounded-2xl bg-[#18181b] border border-slate-800" />
      </div>
    );
  }

  // 2. Show Error / Empty State
  if (isError || !data) {
    return (
      <div className="space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-2xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Agreements</span>
          </button>
        )}
        <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Agreement Document Not Found</h3>
            <p className="text-2xs text-slate-400">
              No registered debt agreement found for ID <span className="font-mono text-indigo-400">{agreementId}</span>.
              {error ? ` (${(error as Error).message})` : ''}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-2xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all cursor-pointer"
            >
              Return to Agreements List
            </button>
          )}
        </div>
      </div>
    );
  }

  const { agreement, lender, borrower, loan, financialSummary, payments, termsAndConditions, declaration } = data;

  const isCompleted = financialSummary.agreementStatus === 'Completed' || financialSummary.remainingAmount === 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-xl border border-slate-800 bg-[#18181b] p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-mono">{agreement.agreementNumber || agreement.id}</h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : financialSummary.agreementStatus === 'Partially Paid'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {financialSummary.agreementStatus}
              </span>
            </div>
            <p className="text-2xs text-slate-400 mt-0.5">
              Official Repayment Covenant • Borrower: <strong className="text-slate-200">{borrower.fullName}</strong>
            </p>
          </div>
        </div>

        {/* TOP CONTROLS & REQUIRED DISABLED ACTION BUTTONS */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tab selector */}
          <div className="inline-flex rounded-xl bg-[#18181b] p-1 border border-slate-800 mr-2">
            <button
              onClick={() => setActiveTab('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'document'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSignature size={12} />
              <span>Printable Document</span>
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-2xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard size={12} />
              <span>Summary View</span>
            </button>
          </div>

          {/* Button 1: Print (disabled) */}
          <button
            disabled
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2 text-2xs font-bold text-slate-500 cursor-not-allowed opacity-60"
            title="Print (disabled)"
          >
            <Printer size={13} />
            <span>Print (disabled)</span>
          </button>

          {/* Button 2: Download PDF (disabled) */}
          <button
            disabled
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2 text-2xs font-bold text-slate-500 cursor-not-allowed opacity-60"
            title="Download PDF (disabled)"
          >
            <Download size={13} />
            <span>Download PDF (disabled)</span>
          </button>

          {/* Button 3: Share (disabled) */}
          <button
            disabled
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2 text-2xs font-bold text-slate-500 cursor-not-allowed opacity-60"
            title="Share (disabled)"
          >
            <Share2 size={13} />
            <span>Share (disabled)</span>
          </button>
        </div>
      </div>

      {/* BUSINESS RULE NOTICE BANNER */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 flex items-center justify-between text-2xs text-slate-300">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-indigo-400 shrink-0" />
          <span>
            <strong className="text-white">Immutable Agreement Body:</strong> Core contractual specifications (Agreement Number, Parties, Loan Details, Terms, Declaration, Signatures) remain permanently fixed.
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 hidden md:inline-block">
          Live Financial Sync Active
        </span>
      </div>

      {/* VIEW MODE 1: PRINTABLE AGREEMENT DOCUMENT LAYOUT */}
      {activeTab === 'document' && (
        <div className="space-y-6">
          {/* Paper Document Container (Designed for crisp readability & print output) */}
          <div className="w-full max-w-4xl mx-auto bg-[#ffffff] text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-6 sm:p-12 font-sans text-xs space-y-8 print:shadow-none print:border-none">
            
            {/* DOCUMENT HEADER / HEADER LOGO */}
            <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
              <div className="flex justify-center mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-serif font-black text-lg">
                  A
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-900 font-serif">
                LOAN AGREEMENT
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase font-mono">
                AMANAH COMPLIANCE LEGAL DEBT REPAYMENT COVENANT
              </p>
            </div>

            {/* SECTION 1: LOAN AGREEMENT METADATA */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Agreement Number</span>
                <span className="font-mono text-sm font-bold text-slate-900">{agreement.agreementNumber || agreement.id}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Agreement Date</span>
                <span className="font-mono text-sm font-semibold text-slate-800">{agreement.createdDate}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Current Status</span>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                }`}>
                  {financialSummary.agreementStatus}
                </span>
              </div>
            </div>

            {/* SECTION 2 & 3: TWO-COLUMN LENDER & BORROWER INFORMATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LENDER INFORMATION */}
              <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Building size={16} className="text-slate-700" />
                  <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider">Lender Information</h3>
                </div>
                <div className="space-y-2 text-2xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Name:</span>
                    <span className="font-bold text-slate-900">{lender.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Phone:</span>
                    <span className="font-mono">{lender.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Email:</span>
                    <span className="font-mono">{lender.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Address:</span>
                    <span className="text-right text-slate-800 max-w-[180px]">{lender.address}</span>
                  </div>
                </div>
              </div>

              {/* BORROWER INFORMATION */}
              <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <User size={16} className="text-slate-700" />
                  <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider">Borrower Information</h3>
                </div>
                <div className="space-y-2 text-2xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Name:</span>
                    <span className="font-bold text-slate-900">{borrower.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Phone:</span>
                    <span className="font-mono">{borrower.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Email:</span>
                    <span className="font-mono">{borrower.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Address:</span>
                    <span className="text-right text-slate-800 max-w-[180px]">{borrower.address}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-500">National ID:</span>
                    <span className="font-mono font-bold text-slate-900">{borrower.nationalId}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECTION 4: LOAN INFORMATION */}
            <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <CreditCard size={16} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider">Loan Information</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-2xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Loan Number</span>
                  <span className="font-mono font-bold text-slate-900">{loan.loanNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Purpose</span>
                  <span className="font-medium text-slate-800">{loan.purpose}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Loan Amount</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(loan.loanAmount, loan.currency)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Loan Date</span>
                  <span className="font-mono text-slate-800">{loan.loanDate}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Due Date</span>
                  <span className="font-mono font-bold text-amber-700">{loan.dueDate}</span>
                </div>
              </div>
            </div>

            {/* SECTION 5: LIVE FINANCIAL SUMMARY (Dynamic) */}
            <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/40 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-indigo-700" />
                  <h3 className="font-bold text-indigo-950 uppercase text-2xs tracking-wider">Live Financial Summary</h3>
                </div>
                <span className="text-[9px] font-mono text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                  Dynamic Auto-Sync
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-2xs">
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Original Loan</span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {formatCurrency(financialSummary.originalLoanAmount, loan.currency)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Paid</span>
                  <span className="font-mono font-bold text-emerald-700 block">
                    {formatCurrency(financialSummary.totalPaid, loan.currency)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Remaining</span>
                  <span className={`font-mono font-bold block ${financialSummary.remainingAmount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {formatCurrency(financialSummary.remainingAmount, loan.currency)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">No. of Payments</span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {financialSummary.numberOfPayments}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Agreement Status</span>
                  <span className="font-bold uppercase text-indigo-900 block text-[10px]">
                    {financialSummary.agreementStatus}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Settlement Date</span>
                  <span className="font-mono text-slate-800 block text-[10px]">
                    {financialSummary.settlementDate || 'Not Settled'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 6: PAYMENT LEDGER TABLE (Dynamic - Newest First) */}
            <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-700" />
                  <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider">Payment Ledger</h3>
                </div>
                <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {payments.length} Transaction{payments.length === 1 ? '' : 's'} (Newest First)
                </span>
              </div>

              {payments.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 space-y-1">
                  <p className="text-2xs font-semibold text-slate-500">No payment transactions recorded yet</p>
                  <p className="text-[10px] text-slate-400">
                    When instalments are received, they will automatically populate this official ledger.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-2xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-50 text-[9px] uppercase font-bold text-slate-600">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Payment Amount</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            +{formatCurrency(p.amount, loan.currency)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{p.method}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{p.referenceNumber || p.transactionId || '—'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-800 whitespace-nowrap">
                            {formatCurrency(p.remainingBalanceAfter, loan.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 7: TERMS & CONDITIONS */}
            <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Scale size={16} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider">Terms & Conditions</h3>
              </div>
              <div className="space-y-2 text-2xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-150">
                {termsAndConditions.map((term, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {term}
                  </p>
                ))}
              </div>
            </div>

            {/* SECTION 8: DECLARATION */}
            <div className="rounded-xl border border-slate-200 p-5 space-y-3 bg-white">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <ShieldCheck size={16} className="text-slate-700" />
                <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider">Declaration & Consensus</h3>
              </div>
              <p className="text-2xs text-slate-700 italic leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-150">
                "{declaration}"
              </p>
            </div>

            {/* SECTION 9: SIGNATURE AREA (Lender, Borrower, Witness 1, Witness 2) */}
            <div className="rounded-xl border border-slate-200 p-6 space-y-4 bg-white pt-6">
              <h3 className="font-bold text-slate-900 uppercase text-2xs tracking-wider border-b border-slate-200 pb-2">
                Signatures & Attestation
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                
                {/* 1. Lender Signature */}
                <div className="border border-slate-200 rounded-lg p-3 text-center space-y-2 bg-slate-50">
                  <div className="h-12 border-b border-slate-300 flex items-center justify-center font-serif italic text-slate-800 text-2xs">
                    {lender.name}
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                    Lender Signature
                  </span>
                </div>

                {/* 2. Borrower Signature */}
                <div className="border border-slate-200 rounded-lg p-3 text-center space-y-2 bg-slate-50">
                  <div className="h-12 border-b border-slate-300 flex items-center justify-center font-serif italic text-slate-800 text-2xs">
                    {borrower.fullName}
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                    Borrower Signature
                  </span>
                </div>

                {/* 3. Witness 1 */}
                <div className="border border-slate-200 rounded-lg p-3 text-center space-y-2 bg-slate-50">
                  <div className="h-12 border-b border-slate-300 flex items-center justify-center font-serif italic text-slate-700 text-2xs">
                    {agreement.witnessName || 'Witness 1'}
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                    Witness 1
                  </span>
                </div>

                {/* 4. Witness 2 */}
                <div className="border border-slate-200 rounded-lg p-3 text-center space-y-2 bg-slate-50">
                  <div className="h-12 border-b border-slate-300 flex items-center justify-center font-serif italic text-slate-700 text-2xs">
                    Witness 2 Attest
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">
                    Witness 2
                  </span>
                </div>

              </div>
            </div>

            {/* DOCUMENT FOOTER */}
            <div className="text-center pt-4 border-t border-slate-200 text-[8px] font-mono text-slate-400 tracking-wider">
              Digitally issued & verified via Amanah Debt & Loan Management System • Immutable Ledger Archive Ref: {agreement.id}
            </div>

          </div>
        </div>
      )}

      {/* VIEW MODE 2: DASHBOARD SUMMARY CARDS VIEW */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agreement Information Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="font-bold text-white uppercase text-2xs tracking-wider flex items-center gap-2">
                <FileSignature size={14} className="text-indigo-400" />
                <span>Agreement Information</span>
              </h3>
              <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                v{agreement.currentVersion || '1'}
              </span>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Agreement Number</span>
                <span className="font-mono font-bold text-emerald-400">{agreement.agreementNumber || agreement.id}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Status</span>
                <span className="font-bold text-indigo-400">{financialSummary.agreementStatus}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Created Date</span>
                <span className="font-mono text-slate-300">{agreement.createdDate}</span>
              </div>
            </div>
          </div>

          {/* Borrower Information Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="font-bold text-white uppercase text-2xs tracking-wider flex items-center gap-2">
                <User size={14} className="text-indigo-400" />
                <span>Borrower Information</span>
              </h3>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Full Name</span>
                <span className="font-bold text-white">{borrower.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Phone</span>
                <span className="font-mono text-slate-300">{borrower.phone}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500">National ID</span>
                <span className="font-mono text-slate-300">{borrower.nationalId}</span>
              </div>
            </div>
          </div>

          {/* Loan Information Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="font-bold text-white uppercase text-2xs tracking-wider flex items-center gap-2">
                <CreditCard size={14} className="text-indigo-400" />
                <span>Loan Information</span>
              </h3>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Loan Number</span>
                <span className="font-mono font-bold text-indigo-400">{loan.loanNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-850">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Loan Amount</span>
                <span className="font-mono font-bold text-white">{formatCurrency(loan.loanAmount, loan.currency)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Due Date</span>
                <span className="font-mono text-amber-400 font-semibold">{loan.dueDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
