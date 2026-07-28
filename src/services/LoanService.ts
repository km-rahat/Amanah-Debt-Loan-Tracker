import { supabase } from '../lib/supabase';
import { Loan } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';
import { TimelineService } from './TimelineService';
import { AgreementService } from './AgreementService';
import { PaymentService } from './PaymentService';

export class LoanError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'LoanError';
    this.code = code;
  }
}

export class LoanService {
  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any): Loan {
    const loanAmount = Number(row.loan_amount ?? row.amount ?? 0);

    let remainingAmount: number;
    if (Array.isArray(row.payments)) {
      const totalPaid = row.payments.reduce((sum: number, p: any) => sum + Number(p.payment_amount ?? 0), 0);
      remainingAmount = Math.max(0, Math.round((loanAmount - totalPaid) * 100) / 100);
    } else if (row.remaining_amount !== undefined && row.remaining_amount !== null) {
      remainingAmount = Math.max(0, Number(row.remaining_amount));
    } else {
      remainingAmount = loanAmount;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = row.due_date ? String(row.due_date).split('T')[0] : '';
    const isDueDatePassed = Boolean(dueDateStr && dueDateStr < todayStr);

    let status = row.status || 'Pending';
    if (status === 'Active') {
      status = 'Pending';
    }

    if (remainingAmount === 0 && loanAmount > 0) {
      status = 'Completed';
    } else if (remainingAmount < loanAmount) {
      status = isDueDatePassed ? 'Overdue' : 'Partially Paid';
    } else if (remainingAmount === loanAmount) {
      status = isDueDatePassed ? 'Overdue' : 'Pending';
    }

    return {
      id: row.id,
      borrowerId: row.borrower_id,
      borrowerName: row.borrowers?.full_name || row.borrower_name || 'Unknown Borrower',
      amount: loanAmount,
      remainingAmount: remainingAmount,
      purpose: row.purpose,
      loanDate: row.loan_date,
      dueDate: row.due_date,
      status: status,
      currency: row.currency || 'USD',
      notes: row.notes || undefined,
    };
  }

  /**
   * Maps React UI model properties to database snake_case columns.
   */
  static mapToDb(item: Partial<Loan>) {
    const dbObj: any = {};
    if (item.borrowerId !== undefined) dbObj.borrower_id = item.borrowerId;
    if (item.amount !== undefined) dbObj.loan_amount = item.amount;
    if (item.remainingAmount !== undefined) dbObj.remaining_amount = item.remainingAmount;
    if (item.purpose !== undefined) dbObj.purpose = item.purpose;
    if (item.loanDate !== undefined) dbObj.loan_date = item.loanDate;
    if (item.dueDate !== undefined) dbObj.due_date = item.dueDate;
    if (item.status !== undefined) dbObj.status = item.status === 'Active' ? 'Pending' : item.status;
    if (item.currency !== undefined) dbObj.currency = item.currency;
    if (item.notes !== undefined) dbObj.notes = item.notes;
    return dbObj;
  }

  /**
   * Reads all loans from the database.
   */
  static async getAll(): Promise<Loan[]> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('loans')
        .select('*, borrowers(full_name), payments(payment_amount)')
        .order('loan_date', { ascending: false });

      if (error) {
        // Fallback: fetch loans and payments separately to ensure remaining balance is always live
        const { data: fbData, error: fbErr } = await supabase
          .from('loans')
          .select('*, borrowers(full_name)')
          .order('loan_date', { ascending: false });
        if (fbErr) throw fbErr;

        const { data: allPayments } = await supabase
          .from('payments')
          .select('loan_id, payment_amount');

        const paymentsByLoanId: Record<string, any[]> = {};
        (allPayments || []).forEach((p: any) => {
          if (!paymentsByLoanId[p.loan_id]) paymentsByLoanId[p.loan_id] = [];
          paymentsByLoanId[p.loan_id].push(p);
        });

        return (fbData || []).map((row: any) => {
          return this.mapRow({
            ...row,
            payments: paymentsByLoanId[row.id] || [],
          });
        });
      }
      return (data || []).map((row: any) => this.mapRow(row));
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Reads a single loan by its unique ID.
   */
  static async getById(id: string): Promise<Loan> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('loans')
        .select('*, borrowers(full_name), payments(payment_amount)')
        .eq('id', id)
        .single();

      if (error) {
        const { data: fbData, error: fbErr } = await supabase
          .from('loans')
          .select('*, borrowers(full_name)')
          .eq('id', id)
          .single();
        if (fbErr) throw fbErr;

        const { data: loanPayments } = await supabase
          .from('payments')
          .select('payment_amount')
          .eq('loan_id', id);

        return this.mapRow({
          ...fbData,
          payments: loanPayments || [],
        });
      }
      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Creates a new loan record.
   */
  static async create(loan: Omit<Loan, 'id' | 'remainingAmount'>): Promise<Loan> {
    try {
      assertSupabaseSetup();

      // NEW BUSINESS RULE CHECK:
      // Verify if borrower has any active/pending/unpaid loan
      const { data: existingLoans, error: checkErr } = await supabase
        .from('loans')
        .select('*, payments(payment_amount)')
        .eq('borrower_id', loan.borrowerId);

      if (checkErr) {
        console.error('[LoanService.create] Error verifying borrower loans:', checkErr.message);
        throw new LoanError('Could not verify borrower loan history, please try again.', 'LOAN_CHECK_FAILED');
      }

      const hasOutstandingLoan = (existingLoans || []).some((l: any) => {
        const loanAmount = Number(l.loan_amount ?? l.amount ?? 0);
        const totalPaid = Array.isArray(l.payments)
          ? l.payments.reduce((sum: number, p: any) => sum + Number(p.payment_amount ?? 0), 0)
          : Number(l.remaining_amount !== undefined && l.remaining_amount !== null ? loanAmount - l.remaining_amount : 0);
        const remaining = Math.max(0, Math.round((loanAmount - totalPaid) * 100) / 100);
        return remaining > 0 || (l.status && l.status !== 'Completed' && l.status !== 'Fully Paid');
      });

      if (hasOutstandingLoan) {
        throw new LoanError(
          'This borrower already has an outstanding loan. New loan cannot be issued until it is fully repaid.',
          'OUTSTANDING_LOAN_EXISTS'
        );
      }

      const dbData = this.mapToDb({
        ...loan,
        status: loan.status && loan.status !== 'Active' ? loan.status : 'Pending',
        remainingAmount: loan.amount,
      });
      const { data, error } = await supabase
        .from('loans')
        .insert(dbData)
        .select('*, borrowers(full_name)')
        .single();

      if (error) throw error;
      const createdLoan = this.mapRow(data);

      // Automatically call PaymentService.recalculateLoanBalance so new loan immediately becomes Pending in DB
      try {
        await PaymentService.recalculateLoanBalance(createdLoan.id);
      } catch (bErr) {
        console.warn('[LoanService.create] Balance recalculation warning:', bErr);
      }

      // Automatically record timeline event
      await TimelineService.addTimelineEvent({
        loanId: createdLoan.id,
        eventType: 'Loan Created',
        title: 'Loan Created',
        description: `Loan created for ${createdLoan.borrowerName} with principal amount of ${createdLoan.currency} ${createdLoan.amount.toLocaleString()}`,
        metadata: {
          amount: createdLoan.amount,
          purpose: createdLoan.purpose,
          dueDate: createdLoan.dueDate,
        },
      });

      // Automatically generate agreement for the new loan (no checkbox required, 1:1 agreement)
      await AgreementService.autoGenerateForLoan(createdLoan);

      return createdLoan;
    } catch (err) {
      if (err instanceof LoanError) throw err;
      throw handleDbError(err);
    }
  }

  /**
   * Updates an existing loan record.
   */
  static async update(id: string, updated: Partial<Loan>): Promise<Loan> {
    try {
      assertSupabaseSetup();
      const dbData = this.mapToDb(updated);
      const { data, error } = await supabase
        .from('loans')
        .update(dbData)
        .eq('id', id)
        .select('*, borrowers(full_name)')
        .single();

      if (error) throw error;
      const updatedLoan = this.mapRow(data);

      // Automatically record timeline event
      await TimelineService.addTimelineEvent({
        loanId: updatedLoan.id,
        eventType: 'Loan Updated',
        title: 'Loan Updated',
        description: `Loan details updated for ${updatedLoan.borrowerName}`,
        metadata: updated,
      });

      if (updated.status === 'Completed' || updated.status === 'Fully Paid') {
        await TimelineService.addTimelineEvent({
          loanId: updatedLoan.id,
          eventType: 'Loan Completed',
          title: 'Loan Completed',
          description: `Loan balance fully settled for ${updatedLoan.borrowerName}`,
        });
      }

      return updatedLoan;
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Deletes a loan record by ID.
   */
  static async delete(id: string): Promise<void> {
    try {
      assertSupabaseSetup();
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw handleDbError(err);
    }
  }
}
