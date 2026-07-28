import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Borrower, Loan, Payment, Agreement, ReminderLog, TimelineEvent, AgreementDetailsData } from '../types';
import { BorrowerService } from '../services/BorrowerService';
import { LoanService } from '../services/LoanService';
import { PaymentService } from '../services/PaymentService';
import { AgreementService } from '../services/AgreementService';
import { ReminderService } from '../services/ReminderService';
import { TimelineService, CreateTimelineEventInput } from '../services/TimelineService';

// Keys for cache invalidation
export const QUERY_KEYS = {
  borrowers: ['borrowers'] as const,
  loans: ['loans'] as const,
  payments: ['payments'] as const,
  agreements: ['agreements'] as const,
  reminders: ['reminders'] as const,
  timeline: ['timeline'] as const,
};

// ==========================================
// 1. BORROWER HOOKS
// ==========================================

export function useBorrowersQuery() {
  return useQuery<Borrower[]>({
    queryKey: QUERY_KEYS.borrowers,
    queryFn: () => BorrowerService.getAll(),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateBorrowerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (borrower: Omit<Borrower, 'id' | 'totalLoans' | 'pendingAmount' | 'joinedDate'>) => 
      BorrowerService.create(borrower),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
    },
  });
}

export function useUpdateBorrowerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Borrower> }) => 
      BorrowerService.update(id, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
    },
  });
}

export function useDeleteBorrowerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BorrowerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
    },
  });
}

// ==========================================
// 2. LOAN HOOKS
// ==========================================

export function useLoansQuery() {
  return useQuery<Loan[]>({
    queryKey: QUERY_KEYS.loans,
    queryFn: () => LoanService.getAll(),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loan: Omit<Loan, 'id' | 'remainingAmount'>) => 
      LoanService.create(loan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline, refetchType: 'all' });
    },
  });
}

export function useUpdateLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Loan> }) => 
      LoanService.update(id, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline, refetchType: 'all' });
    },
  });
}

export function useDeleteLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LoanService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline, refetchType: 'all' });
    },
  });
}

// ==========================================
// 3. PAYMENT HOOKS
// ==========================================

export function usePaymentsQuery() {
  return useQuery<Payment[]>({
    queryKey: QUERY_KEYS.payments,
    queryFn: async () => {
      const data = await PaymentService.getAll();
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: Omit<Payment, 'id'>) => 
      PaymentService.create(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline, refetchType: 'all' });
    },
  });
}

export function useUpdatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Payment> }) => 
      PaymentService.update(id, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline, refetchType: 'all' });
    },
  });
}

export function useDeletePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PaymentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.borrowers, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline, refetchType: 'all' });
    },
  });
}

// ==========================================
// 4. AGREEMENT HOOKS
// ==========================================

export function useAgreementsQuery() {
  return useQuery<Agreement[]>({
    queryKey: QUERY_KEYS.agreements,
    queryFn: () => AgreementService.getAll(),
  });
}

export function useAgreementDetailsQuery(agreementId?: string) {
  return useQuery<AgreementDetailsData | null>({
    queryKey: [...QUERY_KEYS.agreements, 'details', agreementId],
    queryFn: () => agreementId ? AgreementService.getAgreementDetails(agreementId) : null,
    enabled: Boolean(agreementId),
  });
}

export function useCreateAgreementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agreement: Omit<Agreement, 'id' | 'createdDate' | 'version'> & { status: Agreement['status'] }) => 
      AgreementService.create(agreement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements });
    },
  });
}

export function useUpdateAgreementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated, createNewVersion, authorName }: { id: string; updated: Partial<Agreement>; createNewVersion?: boolean; authorName?: string }) => 
      AgreementService.update(id, updated, createNewVersion, authorName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements });
    },
  });
}

export function useRestoreAgreementVersionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetVersion }: { id: string; targetVersion: string }) => 
      AgreementService.restoreVersion(id, targetVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements });
    },
  });
}

export function useDeleteAgreementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AgreementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agreements });
    },
  });
}

// ==========================================
// 5. REMINDER HOOKS
// ==========================================

export function useRemindersQuery() {
  return useQuery<ReminderLog[]>({
    queryKey: QUERY_KEYS.reminders,
    queryFn: () => ReminderService.getAll(),
  });
}

export function useCreateReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminder: Omit<ReminderLog, 'id' | 'reminderDate'>) => 
      ReminderService.create(reminder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders });
    },
  });
}

export function useUpdateReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<ReminderLog> }) => 
      ReminderService.update(id, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders });
    },
  });
}

export function useDeleteReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ReminderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reminders });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline });
    },
  });
}

// ==========================================
// 6. TIMELINE HOOKS
// ==========================================

export function useLoanTimelineQuery(loanId?: string) {
  return useQuery<TimelineEvent[]>({
    queryKey: loanId ? [...QUERY_KEYS.timeline, loanId] : QUERY_KEYS.timeline,
    queryFn: () => loanId ? TimelineService.getTimelineByLoanId(loanId) : TimelineService.getAllTimeline(),
    enabled: true,
  });
}

export function useAddTimelineEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTimelineEventInput) => TimelineService.addTimelineEvent(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline });
      if (variables.loanId) {
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.timeline, variables.loanId] });
      }
    },
  });
}
