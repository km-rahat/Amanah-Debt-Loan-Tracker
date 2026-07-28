import React from 'react';
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  ArrowLeft, 
  Receipt as ReceiptIcon,
  Landmark,
  User,
  Calendar,
  Clock,
  Hash,
  CreditCard,
  FileText
} from 'lucide-react';
import { Payment, Loan } from '../types';
import { useApp } from '../context/AppContext';

interface PaymentReceiptProps {
  payment: Payment;
  loan?: Loan | null;
  onBack?: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ payment, loan, onBack }) => {
  const { formatCurrency: formatCurrencyFromContext } = useApp();
  const formatCurrency = (amount: number, currencyCode?: string) => {
    return formatCurrencyFromContext(amount, currencyCode);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedCreatedAt = payment.createdAt 
    ? new Date(payment.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : payment.paymentDate;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#18181b] text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Return to list"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <ReceiptIcon size={20} className="text-emerald-400" />
              <span>Official Payment Receipt</span>
            </h1>
            <p className="text-xs text-slate-400">
              Receipt Number: <span className="font-mono text-emerald-400 font-bold">{payment.receiptNumber || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
            id="btn-print-receipt"
          >
            <Printer size={14} />
            <span>Print Receipt</span>
          </button>

          {/* Download PDF Button (Disabled as requested) */}
          <button
            disabled
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-bold text-slate-500 opacity-60 cursor-not-allowed"
            title="PDF Download feature is disabled"
            id="btn-download-pdf-disabled"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Voucher Card */}
      <div className="relative rounded-2xl border border-slate-800 bg-[#18181b] overflow-hidden shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Emerald accent bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

        <div className="p-8 space-y-6">
          {/* Header & Logo */}
          <div className="flex justify-between items-start border-b border-slate-800/80 pb-5 print:border-slate-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold print:text-black print:border-black">
                  A
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-white uppercase print:text-black">
                    Amanah Debt Tracker
                  </h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest print:text-slate-600">
                    Micro-Credit Settlement Voucher
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider print:bg-emerald-100 print:text-emerald-800">
                OFFICIAL RECEIPT
              </span>
              <p className="font-mono text-xs font-bold text-slate-300 mt-2 print:text-slate-800">
                {payment.receiptNumber || 'RCPT-UNKNOWN'}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="text-center bg-slate-950/60 p-6 rounded-2xl border border-slate-800/60 print:bg-slate-100 print:border-slate-300">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold print:text-slate-600">
              Payment Amount
            </p>
            <h1 className="text-4xl font-black text-emerald-400 mt-2 font-mono tracking-tight print:text-emerald-700">
              {formatCurrency(payment.amount, loan?.currency)}
            </h1>
            <p className="text-[11px] text-slate-400 mt-2 font-medium print:text-slate-600">
              Method: <span className="text-white font-semibold print:text-black">{payment.method}</span>
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 text-xs">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/60 pb-1.5 print:text-slate-700 print:border-slate-300">
              Transaction Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Receipt Number */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <Hash size={12} className="text-indigo-400" /> Receipt Number
                </span>
                <span className="font-mono font-bold text-emerald-400 text-xs mt-1 block print:text-emerald-800">
                  {payment.receiptNumber || 'N/A'}
                </span>
              </div>

              {/* Borrower */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <User size={12} className="text-indigo-400" /> Borrower Name
                </span>
                <span className="font-bold text-white text-xs mt-1 block print:text-black">
                  {payment.borrowerName}
                </span>
              </div>

              {/* Loan ID */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <FileText size={12} className="text-indigo-400" /> Loan Reference ID
                </span>
                <span className="font-mono font-semibold text-indigo-400 text-xs mt-1 block print:text-indigo-900">
                  {payment.loanId}
                </span>
              </div>

              {/* Payment Date */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <Calendar size={12} className="text-indigo-400" /> Payment Date
                </span>
                <span className="font-mono text-white text-xs mt-1 block print:text-black">
                  {payment.paymentDate}
                </span>
              </div>

              {/* Reference Number */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <CreditCard size={12} className="text-indigo-400" /> Reference Number
                </span>
                <span className="font-mono text-slate-300 text-xs mt-1 block print:text-black">
                  {payment.referenceNumber || 'N/A'}
                </span>
              </div>

              {/* Transaction ID */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <Landmark size={12} className="text-indigo-400" /> Transaction ID
                </span>
                <span className="font-mono text-slate-300 text-xs mt-1 block print:text-black">
                  {payment.transactionId || 'N/A'}
                </span>
              </div>

              {/* Created At */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <Clock size={12} className="text-indigo-400" /> Created At
                </span>
                <span className="font-mono text-slate-300 text-xs mt-1 block print:text-black">
                  {formattedCreatedAt}
                </span>
              </div>

              {/* Remaining Balance After */}
              <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block flex items-center gap-1.5 print:text-slate-600">
                  <CheckCircle2 size={12} className="text-emerald-400" /> Remaining Balance
                </span>
                <span className="font-mono font-bold text-indigo-400 text-xs mt-1 block print:text-indigo-900">
                  {formatCurrency(payment.remainingBalanceAfter ?? (loan ? loan.remainingAmount : 0), loan?.currency)}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {payment.notes && (
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 mt-4 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block print:text-slate-600">
                  Notes / Remarks
                </span>
                <p className="text-slate-300 italic text-xs mt-1 leading-relaxed print:text-slate-800">
                  "{payment.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Footer Verification Seal */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6 text-[10px] text-slate-500 print:border-slate-300">
            <div>
              <p className="font-bold text-slate-400 print:text-black">Amanah System Verified</p>
              <p className="text-[9px] text-slate-500 print:text-slate-600">Electronic ledger entry confirmed</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border-2 border-dashed border-emerald-500 text-emerald-500 flex items-center justify-center font-extrabold text-[9px] uppercase rotate-12 print:border-slate-800 print:text-slate-800">
                PAID
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
