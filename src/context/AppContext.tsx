import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Borrower, Loan, Payment, Agreement, AgreementVersion, ReminderLog, Activity } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ProfileService } from '../services/ProfileService';
import { formatCurrency as formatCurrencyUtil } from '../utils/formatters';

interface AppContextType {
  borrowers: Borrower[];
  loans: Loan[];
  payments: Payment[];
  agreements: Agreement[];
  reminderLogs: ReminderLog[];
  activities: Activity[];
  user: { name: string; email: string; role: string; avatarUrl: string } | null;
  authLoading: boolean;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currency: string;
  setCurrency: (code: string) => void;
  formatCurrency: (amount: number | null | undefined, overrideCurrency?: string) => string;
  login: (email: string, password?: string) => Promise<void> | void;
  logout: () => void;
  addBorrower: (borrower: Omit<Borrower, 'id' | 'totalLoans' | 'pendingAmount' | 'joinedDate'>) => void;
  updateBorrower: (id: string, updated: Partial<Borrower>) => void;
  deleteBorrower: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'remainingAmount'>) => void;
  updateLoan: (id: string, updated: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, updated: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  addAgreement: (agreement: Omit<Agreement, 'id' | 'createdDate' | 'version'> & { status: Agreement['status'] }) => void;
  updateAgreement: (id: string, updated: Partial<Agreement>, createNewVersion?: boolean) => void;
  restoreAgreementVersion: (id: string, targetVersion: string) => void;
  addReminder: (reminder: Omit<ReminderLog, 'id' | 'reminderDate'>) => void;
}

const initialBorrowers: Borrower[] = [
  {
    id: 'BRW-1042',
    name: 'Salim Al-Harthy',
    phone: '+968 9123 4567',
    email: 'salim@company.com',
    totalLoans: 1,
    pendingAmount: 3500,
    status: 'Active',
    joinedDate: '2026-01-15',
    nationalId: '10239482',
    address: 'Mutrah High Street, Muscat, Oman',
    occupation: 'Agricultural Logistics',
    notes: 'Prefers seasonal installment structured advances. Very responsive on WhatsApp.',
  },
  {
    id: 'BRW-3829',
    name: 'Fatma Al-Sadi',
    phone: '+968 9876 5432',
    email: 'fatma@alsadi.org',
    totalLoans: 1,
    pendingAmount: 0,
    status: 'Cleared',
    joinedDate: '2026-03-10',
    nationalId: '10928392',
    address: 'Sohar Port Road, Sohar, Oman',
    occupation: 'Retail Business Owner',
    notes: 'Successfully paid off retail business startup loan ahead of schedule. Highly reliable.',
  },
  {
    id: 'BRW-7492',
    name: 'Tariq Al-Balushi',
    phone: '+968 9988 7766',
    email: 'tariq@balushi.net',
    totalLoans: 1,
    pendingAmount: 3000,
    status: 'Overdue',
    joinedDate: '2026-02-05',
    nationalId: '10594832',
    address: 'Al Haffa Beach District, Salalah, Oman',
    occupation: 'Textile Import Trader',
    notes: 'Outstanding textile credit overdue. Temporary seasonal business slow-down. Requested extended payback deferral.',
  }
];

const initialLoans: Loan[] = [
  {
    id: 'LON-4102',
    borrowerId: 'BRW-1042',
    borrowerName: 'Salim Al-Harthy',
    amount: 5000,
    remainingAmount: 3500,
    purpose: 'Agri-tractor purchase installment',
    loanDate: '2026-02-01',
    dueDate: '2027-02-01',
    status: 'Active',
  },
  {
    id: 'LON-7291',
    borrowerId: 'BRW-3829',
    borrowerName: 'Fatma Al-Sadi',
    amount: 8000,
    remainingAmount: 0,
    purpose: 'Retail showroom lease setup',
    loanDate: '2026-03-12',
    dueDate: '2026-06-12',
    status: 'Fully Paid',
  },
  {
    id: 'LON-1942',
    borrowerId: 'BRW-7492',
    borrowerName: 'Tariq Al-Balushi',
    amount: 3000,
    remainingAmount: 3000,
    purpose: 'Import shipping cargo duty',
    loanDate: '2026-02-10',
    dueDate: '2026-06-10',
    status: 'Overdue',
  }
];

const initialPayments: Payment[] = [];

const initialAgreements: Agreement[] = [
  {
    id: 'AGR-5021',
    loanId: 'LON-4102',
    borrowerId: 'BRW-1042',
    borrowerName: 'Salim Al-Harthy',
    loanAmount: 5000,
    purpose: 'Agri-tractor purchase installment',
    loanDate: '2026-02-01',
    dueDate: '2027-02-01',
    createdDate: '2026-02-01',
    version: 'v1.1',
    status: 'Signed',
    witnessName: 'Mohammed Al-Lawati',
    witnessPhone: '+968 9234 5678',
    versions: [
      {
        version: 'v1.0',
        createdDate: '2026-02-01',
        createdBy: 'System Admin',
        status: 'Draft',
        loanAmount: 5000,
        purpose: 'Agri-tractor purchase installment (Initial draft proposal)',
        loanDate: '2026-02-01',
        dueDate: '2027-02-01',
        witnessName: '',
        witnessPhone: '',
      }
    ]
  },
  {
    id: 'AGR-9124',
    loanId: 'LON-7291',
    borrowerId: 'BRW-3829',
    borrowerName: 'Fatma Al-Sadi',
    loanAmount: 8000,
    purpose: 'Retail showroom lease setup',
    loanDate: '2026-03-12',
    dueDate: '2026-06-12',
    createdDate: '2026-03-12',
    version: 'v1.0',
    status: 'Signed',
    witnessName: 'Ali Al-Balushi',
    witnessPhone: '+968 9111 2222',
    versions: []
  }
];

const initialReminders: ReminderLog[] = [
  {
    id: 'REM-1049',
    borrowerName: 'Tariq Al-Balushi',
    loanId: 'LON-1942',
    reminderDate: '2026-06-15 10:30',
    status: 'Sent',
    note: 'Asalamu Alaikum Tariq, this is a gentle reminder that your loan principal of $3,000 has a due date on 2026-06-10. Please settle.',
  }
];

const initialActivities: Activity[] = [
  {
    id: 'ACT-1001',
    type: 'payment_received',
    message: 'Recorded payment PAY-3849 of $8,000.00 from Fatma Al-Sadi',
    timestamp: '10:30 AM, Today',
  },
  {
    id: 'ACT-1002',
    type: 'loan_created',
    message: 'Issued loan LON-7291 to Fatma Al-Sadi for $8,000.00',
    timestamp: '09:15 AM, Today',
  },
  {
    id: 'ACT-1003',
    type: 'borrower_added',
    message: 'Registered new borrower: Salim Al-Harthy',
    timestamp: 'Yesterday',
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // In-memory clean state with high-quality sample data
  const [borrowers, setBorrowers] = useState<Borrower[]>(initialBorrowers);
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>(initialReminders);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  // Use AuthContext as the single source of truth for user authentication
  const { currentUser, loading: authLoading, signIn, logout: authLogout } = useAuth();

  const user = currentUser
    ? {
        name: currentUser.fullName,
        email: currentUser.email,
        role: currentUser.role,
        avatarUrl: currentUser.avatarUrl,
      }
    : null;

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('amanah_theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('amanah_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('amanah_theme', 'light');
    }
  }, [darkMode]);
  const [currency, setCurrencyState] = useState<string>(() => localStorage.getItem('amanah_currency') || 'BDT');

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem('amanah_currency', code);
  };

  const formatCurrency = (amount: number | null | undefined, overrideCurrency?: string) => {
    return formatCurrencyUtil(amount, overrideCurrency || currency);
  };

  const login = async (email: string, password?: string) => {
    await signIn(email, password);
    logActivity('borrower_added', `User ${email} authenticated successfully.`);
  };

  const logout = async () => {
    await authLogout();
  };

  const logActivity = (type: Activity['type'], message: string) => {
    const newActivity: Activity = {
      id: `ACT-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  // 1. Add Borrower
  const addBorrower = (newB: Omit<Borrower, 'id' | 'totalLoans' | 'pendingAmount' | 'joinedDate'>) => {
    const borrower: Borrower = {
      ...newB,
      id: `BRW-${Math.floor(1000 + Math.random() * 9000)}`,
      totalLoans: 0,
      pendingAmount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setBorrowers(prev => [...prev, borrower]);
    logActivity('borrower_added', `Registered new borrower: ${borrower.name}`);
  };

  // 1b. Update Borrower
  const updateBorrower = (id: string, updated: Partial<Borrower>) => {
    setBorrowers(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
    logActivity('borrower_added', `Updated profile details for borrower: ${updated.name || id}`);
  };

  // 1c. Delete Borrower
  const deleteBorrower = (id: string) => {
    const borrower = borrowers.find(b => b.id === id);
    setBorrowers(prev => prev.filter(b => b.id !== id));
    if (borrower) {
      logActivity('borrower_added', `Deleted borrower profile: ${borrower.name}`);
    }
  };

  // 2. Add Loan
  const addLoan = (newL: Omit<Loan, 'id' | 'remainingAmount'>) => {
    const loanId = `LON-${Math.floor(1000 + Math.random() * 9000)}`;
    const loan: Loan = {
      ...newL,
      id: loanId,
      remainingAmount: newL.amount,
    };
    setLoans(prev => [...prev, loan]);

    // Update Borrower Stats
    setBorrowers(prev =>
      prev.map(b => {
        if (b.id === loan.borrowerId) {
          return {
            ...b,
            totalLoans: b.totalLoans + 1,
            pendingAmount: b.pendingAmount + loan.amount,
            status: 'Active',
          };
        }
        return b;
      })
    );

    logActivity('loan_created', `Issued loan ${loanId} to ${loan.borrowerName} for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(loan.amount)}`);
  };

  // 2b. Update Loan
  const updateLoan = (id: string, updated: Partial<Loan>) => {
    const original = loans.find(l => l.id === id);
    if (!original) return;
    
    setLoans(prev => prev.map(l => {
      if (l.id === id) {
        const newL = { ...l, ...updated };
        if (updated.amount !== undefined && updated.amount !== original.amount) {
          const diff = updated.amount - original.amount;
          newL.remainingAmount = Math.max(0, l.remainingAmount + diff);
        }
        return newL;
      }
      return l;
    }));

    if (updated.amount !== undefined && updated.amount !== original.amount) {
      const diff = updated.amount - original.amount;
      setBorrowers(prev => prev.map(b => {
        if (b.id === original.borrowerId) {
          const newPending = Math.max(0, b.pendingAmount + diff);
          return {
            ...b,
            pendingAmount: newPending,
            status: newPending === 0 ? 'Cleared' : b.status,
          };
        }
        return b;
      }));
    }

    logActivity('loan_created', `Updated details of loan ${id}`);
  };

  // 2c. Delete Loan
  const deleteLoan = (id: string) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    setLoans(prev => prev.filter(l => l.id !== id));
    
    setBorrowers(prev => prev.map(b => {
      if (b.id === loan.borrowerId) {
        const newTotalLoans = Math.max(0, b.totalLoans - 1);
        const newPending = Math.max(0, b.pendingAmount - loan.remainingAmount);
        return {
          ...b,
          totalLoans: newTotalLoans,
          pendingAmount: newPending,
          status: newPending === 0 ? 'Cleared' : b.status,
        };
      }
      return b;
    }));
    logActivity('loan_created', `Deleted loan record ${id}`);
  };

  // 3. Add Payment
  const addPayment = (newP: Omit<Payment, 'id'>) => {
    const paymentId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const associatedLoan = loans.find(l => l.id === newP.loanId);
    const updatedRemaining = associatedLoan ? Math.max(0, associatedLoan.remainingAmount - newP.amount) : 0;
    
    const payment: Payment = {
      ...newP,
      id: paymentId,
      paymentDate: newP.paymentDate || new Date().toISOString().split('T')[0],
      remainingBalanceAfter: updatedRemaining,
    };
    setPayments(prev => [...prev, payment]);

    // Deduct from Loan Remaining Amount
    setLoans(prev =>
      prev.map(l => {
        if (l.id === payment.loanId) {
          const uRemaining = Math.max(0, l.remainingAmount - payment.amount);
          return {
            ...l,
            remainingAmount: uRemaining,
            status: uRemaining === 0 ? 'Fully Paid' : l.status,
          };
        }
        return l;
      })
    );

    // Update Borrower Pending Amount
    setBorrowers(prev =>
      prev.map(b => {
        const assocLoan = loans.find(l => l.id === payment.loanId);
        if (assocLoan && b.id === assocLoan.borrowerId) {
          const updatedPending = Math.max(0, b.pendingAmount - payment.amount);
          return {
            ...b,
            pendingAmount: updatedPending,
            status: updatedPending === 0 ? 'Cleared' : b.status,
          };
        }
        return b;
      })
    );

    logActivity('payment_received', `Recorded payment ${paymentId} of ${payment.amount} from ${payment.borrowerName}`);
  };

  // 3b. Delete Payment
  const deletePayment = (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    setPayments(prev => prev.filter(p => p.id !== id));

    // Restore Loan Remaining Amount
    setLoans(prev =>
      prev.map(l => {
        if (l.id === payment.loanId) {
          const updatedRemaining = l.remainingAmount + payment.amount;
          return {
            ...l,
            remainingAmount: updatedRemaining,
            status: updatedRemaining > 0 
              ? (new Date(l.dueDate) < new Date() ? 'Overdue' : 'Active')
              : 'Fully Paid',
          };
        }
        return l;
      })
    );

    // Restore Borrower Pending Amount
    setBorrowers(prev =>
      prev.map(b => {
        const assocLoan = loans.find(l => l.id === payment.loanId);
        if (assocLoan && b.id === assocLoan.borrowerId) {
          const updatedPending = b.pendingAmount + payment.amount;
          return {
            ...b,
            pendingAmount: updatedPending,
            status: updatedPending > 0 ? 'Active' : 'Cleared',
          };
        }
        return b;
      })
    );

    logActivity('payment_received', `Reversed payment transaction ${id}`);
  };

  // 3c. Update Payment
  const updatePayment = (id: string, updated: Partial<Payment>) => {
    const original = payments.find(p => p.id === id);
    if (!original) return;

    const diff = (updated.amount !== undefined ? updated.amount : original.amount) - original.amount;

    setPayments(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updatedPayment = { ...p, ...updated };
          if (diff !== 0) {
            const l = loans.find(loan => loan.id === p.loanId);
            if (l) {
              updatedPayment.remainingBalanceAfter = Math.max(0, (p.remainingBalanceAfter ?? l.remainingAmount) - diff);
            }
          }
          return updatedPayment;
        }
        return p;
      })
    );

    if (diff !== 0) {
      setLoans(prev =>
        prev.map(l => {
          if (l.id === original.loanId) {
            const updatedRemaining = Math.max(0, l.remainingAmount - diff);
            return {
              ...l,
              remainingAmount: updatedRemaining,
              status: updatedRemaining === 0 ? 'Fully Paid' : (new Date(l.dueDate) < new Date() ? 'Overdue' : 'Active'),
            };
          }
          return l;
        })
      );

      setBorrowers(prev =>
        prev.map(b => {
          const assocLoan = loans.find(l => l.id === original.loanId);
          if (assocLoan && b.id === assocLoan.borrowerId) {
            const updatedPending = Math.max(0, b.pendingAmount - diff);
            return {
              ...b,
              pendingAmount: updatedPending,
              status: updatedPending === 0 ? 'Cleared' : b.status,
            };
          }
          return b;
        })
      );
    }

    logActivity('payment_received', `Updated payment transaction ${id}`);
  };

  // 4. Add Agreement
  const addAgreement = (newA: Omit<Agreement, 'id' | 'createdDate' | 'version'> & { status: Agreement['status'] }) => {
    const agreement: Agreement = {
      ...newA,
      id: `AGR-${Math.floor(1000 + Math.random() * 9000)}`,
      createdDate: new Date().toISOString().split('T')[0],
      version: 'v1.0',
      versions: [],
    };
    setAgreements(prev => [...prev, agreement]);
    logActivity('agreement_signed', `Drafted agreement ${agreement.id} for ${agreement.borrowerName}`);
  };

  // 4b. Update Agreement with version control option
  const updateAgreement = (id: string, updated: Partial<Agreement>, createNewVersion = false) => {
    setAgreements(prev =>
      prev.map(agr => {
        if (agr.id === id) {
          if (createNewVersion) {
            // Build the historical version
            const histVersion: AgreementVersion = {
              version: agr.version,
              createdDate: agr.createdDate,
              createdBy: user?.name || 'System Admin',
              status: agr.status,
              loanAmount: agr.loanAmount,
              purpose: agr.purpose,
              loanDate: agr.loanDate,
              dueDate: agr.dueDate,
              witnessName: agr.witnessName,
              witnessPhone: agr.witnessPhone,
            };

            // Bump active version number automatically (Y in vX.Y)
            const match = agr.version.match(/v?(\d+)\.(\d+)/);
            let nextVersion = 'v1.0';
            if (match) {
              const major = parseInt(match[1]);
              const minor = parseInt(match[2]);
              nextVersion = `v${major}.${minor + 1}`;
            }

            const updatedAgreements: Agreement = {
              ...agr,
              ...updated,
              version: nextVersion,
              createdDate: new Date().toISOString().split('T')[0],
              versions: [...(agr.versions || []), histVersion],
            };

            logActivity('agreement_signed', `Created new version ${nextVersion} for Agreement ${id}`);
            return updatedAgreements;
          } else {
            // Edit in place
            const updatedAgreements = {
              ...agr,
              ...updated,
            };
            logActivity('agreement_signed', `Updated Agreement ${id} details in-place`);
            return updatedAgreements;
          }
        }
        return agr;
      })
    );
  };

  // 4c. Restore Agreement Version
  const restoreAgreementVersion = (id: string, targetVersion: string) => {
    setAgreements(prev =>
      prev.map(agr => {
        if (agr.id === id) {
          const hist = agr.versions?.find(v => v.version === targetVersion);
          if (!hist) return agr;

          // Save current state in history as archived
          const currentAsHist: AgreementVersion = {
            version: agr.version,
            createdDate: agr.createdDate,
            createdBy: user?.name || 'System Admin',
            status: agr.status,
            loanAmount: agr.loanAmount,
            purpose: agr.purpose,
            loanDate: agr.loanDate,
            dueDate: agr.dueDate,
            witnessName: agr.witnessName,
            witnessPhone: agr.witnessPhone,
          };

          // Filter out restored version and add current state
          const cleanHistory = (agr.versions || []).filter(v => v.version !== targetVersion);

          const updatedAgreements: Agreement = {
            ...agr,
            version: hist.version,
            createdDate: hist.createdDate,
            status: hist.status,
            loanAmount: hist.loanAmount,
            purpose: hist.purpose,
            loanDate: hist.loanDate,
            dueDate: hist.dueDate,
            witnessName: hist.witnessName,
            witnessPhone: hist.witnessPhone,
            versions: [...cleanHistory, currentAsHist],
          };

          logActivity('agreement_signed', `Restored Agreement ${id} to version ${targetVersion}`);
          return updatedAgreements;
        }
        return agr;
      })
    );
  };

  // 5. Add Reminder
  const addReminder = (newR: Omit<ReminderLog, 'id' | 'reminderDate'>) => {
    const reminder: ReminderLog = {
      ...newR,
      id: `REM-${Math.floor(1000 + Math.random() * 9000)}`,
      reminderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setReminderLogs(prev => [...prev, reminder]);
    logActivity('reminder_sent', `Logged ${reminder.status.toLowerCase()} reminder alert for ${reminder.borrowerName}`);
  };

  return (
    <AppContext.Provider
      value={{
        borrowers,
        loans,
        payments,
        agreements,
        reminderLogs,
        activities,
        user,
        authLoading,
        darkMode,
        setDarkMode,
        currency,
        setCurrency,
        formatCurrency,
        login,
        logout,
        addBorrower,
        updateBorrower,
        deleteBorrower,
        addLoan,
        updateLoan,
        deleteLoan,
        addPayment,
        updatePayment,
        deletePayment,
        addAgreement,
        updateAgreement,
        restoreAgreementVersion,
        addReminder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
