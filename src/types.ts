export interface Borrower {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalLoans: number;
  pendingAmount: number;
  status: 'Active' | 'Cleared' | 'Overdue';
  joinedDate: string;
  nationalId?: string;
  address?: string;
  occupation?: string;
  notes?: string;
  user_id?: string;
}

export interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  remainingAmount: number;
  purpose: string;
  loanDate: string;
  dueDate: string;
  status: 'Pending' | 'Partially Paid' | 'Completed' | 'Overdue' | 'Active' | 'Fully Paid';
  currency?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  borrowerName: string;
  loanId: string;
  amount: number;
  paymentDate: string;
  method: 'Bank Transfer' | 'Cash' | 'Card' | 'Mobile Money' | 'Cheque' | 'Mobile Banking' | 'Other';
  referenceNumber?: string;
  transactionId?: string;
  receiptNumber?: string;
  createdBy?: string;
  notes?: string;
  createdAt?: string;
  remainingBalanceAfter?: number;
}

export interface AgreementVersion {
  version: string;
  createdDate: string;
  createdBy: string;
  status: 'Signed' | 'Pending' | 'Draft' | 'Archived';
  loanAmount: number;
  purpose: string;
  loanDate: string;
  dueDate: string;
  witnessName?: string;
  witnessPhone?: string;
}

export interface Agreement {
  id: string;
  loanId: string;
  borrowerId?: string;
  borrowerName: string;
  loanAmount: number;
  purpose: string;
  loanDate: string;
  dueDate: string;
  witnessName?: string;
  witnessPhone?: string;
  createdDate: string;
  version: string;
  pdfUrl?: string;
  status: 'Signed' | 'Pending' | 'Draft' | 'Archived' | 'Active';
  agreementNumber?: string;
  currentVersion?: number;
  totalPaid?: number;
  remainingAmount?: number;
  versions?: AgreementVersion[];
}

export interface ReminderLog {
  id: string;
  borrowerName: string;
  loanId: string;
  reminderDate: string;
  status: 'Sent' | 'Pending' | 'Failed';
  note: string;
}

export interface Activity {
  id: string;
  type: 'loan_created' | 'payment_received' | 'borrower_added' | 'agreement_signed' | 'reminder_sent';
  message: string;
  timestamp: string;
}

export interface Profile {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt?: string;
}

export interface TimelineEvent {
  id: string;
  loanId: string;
  eventType: 
    | 'Loan Created'
    | 'Loan Updated'
    | 'Payment Received'
    | 'Payment Updated'
    | 'Payment Deleted'
    | 'Loan Completed'
    | 'Loan Reopened'
    | 'Reminder Sent'
    | 'Agreement Generated'
    | string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
}

export interface AgreementDetailsData {
  agreement: Agreement;
  lender: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  borrower: {
    fullName: string;
    phone: string;
    email: string;
    nationalId: string;
    address: string;
  };
  loan: {
    loanNumber: string;
    purpose: string;
    loanAmount: number;
    loanDate: string;
    dueDate: string;
    currency: string;
  };
  financialSummary: {
    originalLoanAmount: number;
    totalPaid: number;
    remainingAmount: number;
    numberOfPayments: number;
    lastPaymentDate: string | null;
    agreementStatus: string;
    settlementDate: string | null;
  };
  payments: Array<Payment & { remainingBalanceAfter: number }>;
  termsAndConditions: string[];
  declaration: string;
}


