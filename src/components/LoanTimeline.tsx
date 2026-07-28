import React from 'react';
import { 
  PlusCircle, 
  Edit3, 
  ArrowDownLeft, 
  Sliders, 
  Trash2, 
  CheckCheck, 
  RotateCcw, 
  Bell, 
  FileText, 
  Clock, 
  Loader2,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { TimelineEvent } from '../types';
import { useLoanTimelineQuery } from '../hooks/useSupabaseQueries';
import { useApp } from '../context/AppContext';

interface LoanTimelineProps {
  loanId: string;
}

export const LoanTimeline: React.FC<LoanTimelineProps> = ({ loanId }) => {
  const { formatCurrency } = useApp();
  const { data: timelineEvents = [], isLoading, isError, refetch } = useLoanTimelineQuery(loanId);

  // Helper to choose event icon & styling badge based on eventType
  const getEventStyle = (type: string) => {
    switch (type) {
      case 'Loan Created':
        return {
          icon: <PlusCircle size={15} className="text-emerald-400" />,
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          textColor: 'text-emerald-400',
          badgeText: 'Created',
        };
      case 'Loan Updated':
        return {
          icon: <Edit3 size={15} className="text-amber-400" />,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          textColor: 'text-amber-400',
          badgeText: 'Updated',
        };
      case 'Payment Received':
        return {
          icon: <ArrowDownLeft size={15} className="text-emerald-400" />,
          bgColor: 'bg-emerald-500/15',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-300',
          badgeText: 'Payment',
        };
      case 'Payment Updated':
        return {
          icon: <Sliders size={15} className="text-indigo-400" />,
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-500/20',
          textColor: 'text-indigo-400',
          badgeText: 'Payment Edit',
        };
      case 'Payment Deleted':
        return {
          icon: <Trash2 size={15} className="text-rose-400" />,
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/20',
          textColor: 'text-rose-400',
          badgeText: 'Payment Void',
        };
      case 'Loan Completed':
        return {
          icon: <CheckCheck size={15} className="text-emerald-400" />,
          bgColor: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/40',
          textColor: 'text-emerald-400',
          badgeText: 'Completed',
        };
      case 'Loan Reopened':
        return {
          icon: <RotateCcw size={15} className="text-orange-400" />,
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          textColor: 'text-orange-400',
          badgeText: 'Reopened',
        };
      case 'Reminder Sent':
        return {
          icon: <Bell size={15} className="text-sky-400" />,
          bgColor: 'bg-sky-500/10',
          borderColor: 'border-sky-500/20',
          textColor: 'text-sky-400',
          badgeText: 'Reminder',
        };
      case 'Agreement Generated':
        return {
          icon: <ShieldCheck size={15} className="text-purple-400" />,
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          textColor: 'text-purple-400',
          badgeText: 'Agreement',
        };
      default:
        return {
          icon: <FileText size={15} className="text-slate-400" />,
          bgColor: 'bg-slate-800',
          borderColor: 'border-slate-700',
          textColor: 'text-slate-300',
          badgeText: type,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#18181b] p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-indigo-400" />
          <h3 className="text-2xs font-bold text-slate-300 uppercase tracking-wider">
            Loan Activity Timeline
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 font-mono">
          {timelineEvents.length} Events
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Loader2 size={24} className="animate-spin text-indigo-400 mb-2" />
          <p className="text-xs">Loading loan timeline...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-rose-500/5 rounded-xl border border-rose-500/10 p-4">
          <AlertCircle size={20} className="text-rose-400 mb-1" />
          <p className="text-xs font-semibold text-rose-300">Could not load timeline</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-[10px] bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg hover:bg-rose-500/30 cursor-pointer transition-all"
          >
            Retry
          </button>
        </div>
      ) : timelineEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
          <Clock size={22} className="text-slate-600 mb-2" />
          <p className="text-xs font-semibold text-slate-400">No Timeline Events</p>
          <p className="text-[10px] text-slate-500 max-w-xs mt-1">
            Activity and settlement log records will appear here chronologically as actions occur.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[1px] before:bg-slate-800">
          {timelineEvents.map((event) => {
            const style = getEventStyle(event.eventType);

            return (
              <div key={event.id} className="relative flex items-start gap-3 group">
                {/* Timeline Dot Icon */}
                <div className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#18181b] border ${style.borderColor}`}>
                  {style.icon}
                </div>

                {/* Timeline Card */}
                <div className="flex-1 rounded-xl bg-slate-950/60 p-4 border border-slate-800/60 hover:border-slate-700/80 transition-all space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${style.bgColor} ${style.borderColor} ${style.textColor}`}>
                        {style.badgeText}
                      </span>
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        {event.title}
                      </h4>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 shrink-0">
                      <Calendar size={11} className="text-slate-600" />
                      {formatDate(event.createdAt)}
                    </span>
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {event.description}
                    </p>
                  )}

                  {/* Optional Metadata snippet if available */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="pt-2 border-t border-slate-850/60 flex flex-wrap gap-2 text-[10px] text-slate-400">
                      {event.metadata.receiptNumber && (
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-emerald-400">
                          Receipt: {event.metadata.receiptNumber}
                        </span>
                      )}
                      {event.metadata.amount && (
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono text-indigo-300">
                          Amount: {formatCurrency(Number(event.metadata.amount))}
                        </span>
                      )}
                      {event.metadata.method && (
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Method: {event.metadata.method}
                        </span>
                      )}
                    </div>
                  )}

                  {event.createdBy && (
                    <p className="text-[9px] text-green-600 dark:text-green-400 flex items-center gap-1 pt-0.5">
                      <User size={10} className="text-green-600 dark:text-green-400" /> Logged by: {event.createdBy}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LoanTimeline;
