import { supabase } from '../lib/supabase';
import { Payment } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';
import { TimelineService } from './TimelineService';
import { AgreementService } from './AgreementService';
import { getAuthenticatedUser, PaymentError } from '../utils/auth';

export class PaymentService {
  /**
   * Generates a unique sequence receipt number in format RCPT-2026-000001
   */
  static async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCPT-${year}-`;
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('payments')
        .select('receipt_number');

      if (!error && data) {
        let maxSeq = 0;
        for (const row of data) {
          if (row.receipt_number && typeof row.receipt_number === 'string') {
            if (row.receipt_number.startsWith(prefix)) {
              const numPart = row.receipt_number.substring(prefix.length);
              const seq = parseInt(numPart, 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            } else if (row.receipt_number.startsWith('RCPT-')) {
              const parts = row.receipt_number.split('-');
              const lastPart = parts[parts.length - 1];
              const seq = parseInt(lastPart, 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        }
        const nextSeq = maxSeq + 1;
        return `${prefix}${String(nextSeq).padStart(6, '0')}`;
      }
    } catch (err) {
      console.warn('[PaymentService.generateReceiptNumber] Could not query existing receipt numbers:', err);
    }

    return `${prefix}000001`;
  }

  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any): Payment {
    const fallbackYear = new Date().getFullYear();
    const fallbackSeq = String(row.id || '1').replace(/\D/g, '').slice(-6).padStart(6, '0') || '000001';
    const defaultReceiptNumber = `RCPT-${fallbackYear}-${fallbackSeq}`;

    return {
      id: row.id,
      borrowerName: row.loans?.borrowers?.full_name || 'Unknown Borrower',
      loanId: row.loan_id,
      amount: Number(row.payment_amount ?? 0),
      paymentDate: row.payment_date || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
      method: (row.payment_method || 'Bank Transfer') as any,
      referenceNumber: row.reference_number || undefined,
      transactionId: row.transaction_id || undefined,
      receiptNumber: row.receipt_number || defaultReceiptNumber,
      createdBy: row.created_by || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      remainingBalanceAfter: row.remaining_balance_after !== undefined && row.remaining_balance_after !== null ? Number(row.remaining_balance_after) : undefined,
    };
  }

  /**
   * Maps React UI model properties to database snake_case columns.
   */
  static mapToDb(item: Partial<Payment>) {
    const dbObj: any = {};
    if (item.loanId !== undefined) dbObj.loan_id = item.loanId;
    if (item.amount !== undefined) dbObj.payment_amount = item.amount;
    if (item.paymentDate !== undefined) dbObj.payment_date = item.paymentDate;
    if (item.method !== undefined) dbObj.payment_method = item.method;
    if (item.referenceNumber !== undefined) dbObj.reference_number = item.referenceNumber;
    if (item.notes !== undefined) dbObj.notes = item.notes;
    if (item.remainingBalanceAfter !== undefined) dbObj.remaining_balance_after = item.remainingBalanceAfter;
    return dbObj;
  }

  /**
   * Recalculates Total Paid for a loan and automatically updates remaining_amount and status in loans table.
   * Single source of truth for database loan balance updates.
   */
  static async recalculateLoanBalance(loanId: string): Promise<void> {
    assertSupabaseSetup();

    if (!loanId) return;

    // 1. Read related loan from DB
    const { data: loan, error: loanErr } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (loanErr || !loan) {
      console.warn(`[PaymentService.recalculateLoanBalance] Could not find loan ${loanId} to recalculate.`);
      return;
    }

    // 2. Read all payments for that loan from DB
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('payment_amount')
      .eq('loan_id', loanId);

    if (payErr) {
      console.warn(`[PaymentService.recalculateLoanBalance] Error fetching payments for loan ${loanId}:`, payErr.message);
    }

    // 3. Calculate Total Paid = SUM(payment_amount)
    const totalPaid = (payments || []).reduce((sum: number, p: any) => {
      return sum + Number(p.payment_amount ?? 0);
    }, 0);

    const loanAmount = Number(loan.loan_amount ?? loan.amount ?? 0);
    const remainingAmount = Math.max(0, Math.round((loanAmount - totalPaid) * 100) / 100);

    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = loan.due_date ? String(loan.due_date).split('T')[0] : '';
    const isDueDatePassed = Boolean(dueDateStr && dueDateStr < todayStr);

    const rawPrevStatus = loan.status;
    const previousStatus = rawPrevStatus === 'Active' ? 'Pending' : (rawPrevStatus || 'Pending');
    let status: string;

    if (remainingAmount === 0 && loanAmount > 0) {
      status = 'Completed';
    } else if (remainingAmount === loanAmount) {
      status = isDueDatePassed ? 'Overdue' : 'Pending';
    } else { // 0 < remainingAmount < loanAmount
      status = isDueDatePassed ? 'Overdue' : 'Partially Paid';
    }

    // 4. Update the loans table in database
    const { error: updateErr } = await supabase
      .from('loans')
      .update({
        remaining_amount: remainingAmount,
        status: status,
      })
      .eq('id', loanId);

    if (updateErr) {
      console.error(`[PaymentService.recalculateLoanBalance] Error updating loan ${loanId}:`, updateErr.message);
      throw handleDbError(updateErr);
    }

    // 5. Record status transition timeline events
    if (previousStatus !== status) {
      try {
        if ((previousStatus === 'Pending' || previousStatus === 'Active') && status === 'Partially Paid') {
          await TimelineService.addTimelineEvent({
            loanId: loanId,
            eventType: 'Payment Received',
            title: 'Payment Received',
            description: `Payment received. Status updated to Partially Paid ($${remainingAmount.toLocaleString()} remaining).`,
          });
        } else if (status === 'Completed') {
          await TimelineService.addTimelineEvent({
            loanId: loanId,
            eventType: 'Loan Completed',
            title: 'Loan Completed',
            description: `Loan balance has been fully settled ($0 remaining).`,
          });
        } else if (previousStatus === 'Completed' && (status === 'Partially Paid' || status === 'Pending' || status === 'Overdue')) {
          await TimelineService.addTimelineEvent({
            loanId: loanId,
            eventType: 'Loan Reopened',
            title: 'Loan Reopened',
            description: `Loan was reopened due to payment modification (New status: ${status}, $${remainingAmount.toLocaleString()} remaining).`,
          });
        }
      } catch (tErr) {
        console.warn('[PaymentService.recalculateLoanBalance] Timeline event notice:', tErr);
      }
    }

    // 6. Sync agreement summary if applicable
    try {
      await AgreementService.updateAgreementFinancialSummary(loanId);
    } catch (aErr) {
      console.warn('[PaymentService.recalculateLoanBalance] Agreement summary notice:', aErr);
    }
  }

  /**
   * Reads all payments from the database.
   */
  static async getAll(): Promise<Payment[]> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('payments')
        .select('*, loans(borrowers(full_name))')
        .order('payment_date', { ascending: false });

      if (error) {
        console.warn('[PaymentService.getAll] Joined query notice, falling back to select(*):', error.message);
        const { data: fbData, error: fbErr } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false });

        if (fbErr) throw fbErr;
        return (fbData || []).map((row: any) => this.mapRow(row));
      }

      return (data || []).map((row: any) => this.mapRow(row));
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Reads a single payment by its ID.
   */
  static async getById(id: string): Promise<Payment> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('payments')
        .select('*, loans(borrowers(full_name))')
        .eq('id', id)
        .single();

      if (error) {
        const { data: fbData, error: fbErr } = await supabase
          .from('payments')
          .select('*')
          .eq('id', id)
          .single();

        if (fbErr) throw fbErr;
        return this.mapRow(fbData);
      }

      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Creates a new payment record using authenticated user session and updates loan balance.
   */
  static async create(payment: Omit<Payment, 'id'>): Promise<Payment> {
    try {
      assertSupabaseSetup();

      // 1. Get authenticated user - throw AuthError if missing session
      const user = await getAuthenticatedUser();

      if (!payment.loanId) {
        throw new PaymentError('Loan ID is required to process a payment.', 'MISSING_LOAN_ID');
      }

      if (!payment.amount || payment.amount <= 0) {
        throw new PaymentError('Payment amount must be greater than 0.', 'INVALID_AMOUNT');
      }

      // 2. Fetch related loan
      const { data: loan, error: loanErr } = await supabase
        .from('loans')
        .select('*, borrowers(*)')
        .eq('id', payment.loanId)
        .maybeSingle();

      if (loanErr) throw handleDbError(loanErr);
      if (!loan) {
        throw new PaymentError(`Loan record (${payment.loanId}) not found.`, 'LOAN_NOT_FOUND');
      }

      // 3. Fetch existing payments to verify current remaining balance (FRESH QUERY directly from payments table)
      const { data: existingPayments, error: payErr } = await supabase
        .from('payments')
        .select('payment_amount')
        .eq('loan_id', payment.loanId);

      // FAIL-SAFE / FAIL-CLOSED CHECK:
      // If fetching existing payments produces an error, REJECT immediately with explicit required message.
      if (payErr || !existingPayments) {
        console.error('[PaymentService.create] Error reading existing payments:', payErr?.message);
        throw new PaymentError('Could not verify current loan balance, please try again.', 'BALANCE_VERIFICATION_FAILED');
      }

      const loanAmount = Number(loan.loan_amount ?? loan.amount ?? 0);
      const currentTotalPaid = existingPayments.reduce((sum: number, p: any) => {
        return sum + Number(p.payment_amount ?? 0);
      }, 0);
      const currentRemaining = Math.max(0, Math.round((loanAmount - currentTotalPaid) * 100) / 100);
      const roundedPaymentAmount = Math.round(Number(payment.amount) * 100) / 100;

      if (currentRemaining <= 0 || loan.status === 'Completed' || loan.status === 'Fully Paid') {
        throw new PaymentError('This loan has already been fully paid.', 'LOAN_FULLY_PAID');
      }

      if (roundedPaymentAmount > currentRemaining + 0.001) {
        throw new PaymentError(
          `Payment amount cannot exceed the remaining loan balance of ${currentRemaining}.`,
          'EXCEEDS_BALANCE'
        );
      }

      const calculatedRemaining = Math.max(0, Math.round((currentRemaining - roundedPaymentAmount) * 100) / 100);
      const receiptNum = payment.receiptNumber || (await this.generateReceiptNumber());
      const pDate = payment.paymentDate || new Date().toISOString().split('T')[0];

      // Clean single payload with authenticated created_by
      const payload = {
        loan_id: payment.loanId,
        payment_amount: roundedPaymentAmount,
        payment_date: pDate,
        payment_method: payment.method || 'Bank Transfer',
        reference_number: payment.referenceNumber || null,
        notes: payment.notes || null,
        receipt_number: receiptNum,
        remaining_balance_after: calculatedRemaining,
        created_by: user.id,
      };

      console.log('[PaymentService.create] Authenticated user:', user.id);
      console.log('[PaymentService.create] Clean payload:', payload);

      const { data, error } = await supabase
        .from('payments')
        .insert(payload)
        .select('*, loans(borrowers(full_name))');

      let insertedRow: any = null;

      if (error) {
        console.warn('[PaymentService.create] Select returned error, falling back to insert-only:', error.message);
        const { data: insData, error: insertOnlyErr } = await supabase
          .from('payments')
          .insert(payload)
          .select('id')
          .single();

        if (insertOnlyErr) {
          throw handleDbError(insertOnlyErr);
        }

        insertedRow = {
          id: insData?.id || crypto.randomUUID(),
          ...payload,
          created_at: new Date().toISOString(),
          loans: loan,
        };
      } else if (data && data.length > 0) {
        insertedRow = data[0];
      } else {
        insertedRow = {
          id: crypto.randomUUID(),
          ...payload,
          created_at: new Date().toISOString(),
          loans: loan,
        };
      }

      if (insertedRow && !insertedRow.loans && loan) {
        insertedRow.loans = loan;
      }

      // ATOMIC DOUBLE-CLICK / CONCURRENCY VERIFICATION CHECK:
      // Re-query payments table for this loan to verify total paid hasn't breached loan amount
      const { data: verifyPayments, error: verifyErr } = await supabase
        .from('payments')
        .select('id, payment_amount')
        .eq('loan_id', payment.loanId);

      if (verifyErr || !verifyPayments) {
        if (insertedRow?.id) {
          await supabase.from('payments').delete().eq('id', insertedRow.id);
        }
        throw new PaymentError('Could not verify current loan balance, please try again.', 'BALANCE_VERIFICATION_FAILED');
      }

      const postTotalPaid = verifyPayments.reduce((sum: number, p: any) => sum + Number(p.payment_amount ?? 0), 0);
      if (postTotalPaid > loanAmount + 0.001) {
        // Rollback inserted payment if concurrent requests breached loan balance
        if (insertedRow?.id) {
          await supabase.from('payments').delete().eq('id', insertedRow.id);
        }
        throw new PaymentError(
          `Payment amount cannot exceed the remaining loan balance of ${currentRemaining}.`,
          'EXCEEDS_BALANCE'
        );
      }

      const createdPayment = this.mapRow(insertedRow);

      // Trigger timeline event, loan balance recalculation, agreement financial summary
      try {
        await TimelineService.addTimelineEvent({
          loanId: payment.loanId,
          eventType: 'Payment Received',
          title: 'Payment Received',
          description: `Payment of $${createdPayment.amount.toLocaleString()} received via ${createdPayment.method}. Receipt: ${createdPayment.receiptNumber}`,
          createdBy: user.id,
          metadata: {
            paymentId: createdPayment.id,
            receiptNumber: createdPayment.receiptNumber,
            amount: createdPayment.amount,
            method: createdPayment.method,
            referenceNumber: createdPayment.referenceNumber,
          },
        });
      } catch (tErr) {
        console.warn('[PaymentService.create] Timeline event notice:', tErr);
      }

      try {
        await this.recalculateLoanBalance(payment.loanId);
      } catch (bErr) {
        console.warn('[PaymentService.create] Recalculation notice:', bErr);
      }

      try {
        await AgreementService.updateAgreementFinancialSummary(payment.loanId);
      } catch (aErr) {
        console.warn('[PaymentService.create] Agreement summary notice:', aErr);
      }

      return createdPayment;
    } catch (err) {
      if (err instanceof PaymentError) throw err;
      throw handleDbError(err);
    }
  }

  /**
   * Updates an existing payment and updates loan balance & status.
   */
  static async update(id: string, updated: Partial<Payment>): Promise<Payment> {
    try {
      assertSupabaseSetup();
      const user = await getAuthenticatedUser();

      const existingPayment = await this.getById(id);
      const targetLoanId = updated.loanId || existingPayment.loanId;

      if (updated.amount !== undefined) {
        if (updated.amount <= 0) {
          throw new PaymentError('Payment amount must be greater than 0.', 'INVALID_AMOUNT');
        }

        const { data: loan, error: loanErr } = await supabase
          .from('loans')
          .select('*')
          .eq('id', targetLoanId)
          .single();

        if (loanErr || !loan) {
          throw new PaymentError(`Loan record (${targetLoanId}) not found.`, 'LOAN_NOT_FOUND');
        }

        const { data: otherPayments, error: payErr } = await supabase
          .from('payments')
          .select('id, payment_amount')
          .eq('loan_id', targetLoanId)
          .neq('id', id);

        if (payErr || !otherPayments) {
          console.error('[PaymentService.update] Error reading existing payments:', payErr?.message);
          throw new PaymentError('Could not verify current loan balance, please try again.', 'BALANCE_VERIFICATION_FAILED');
        }

        const loanAmount = Number(loan.loan_amount ?? loan.amount ?? 0);
        const otherTotalPaid = (otherPayments || []).reduce((sum: number, p: any) => {
          return sum + Number(p.payment_amount ?? 0);
        }, 0);
        const availableRemaining = Math.max(0, Math.round((loanAmount - otherTotalPaid) * 100) / 100);
        const roundedUpdateAmount = Math.round(Number(updated.amount) * 100) / 100;

        if (roundedUpdateAmount > availableRemaining + 0.01) {
          throw new PaymentError(
            `Payment amount cannot exceed the remaining loan balance of ${availableRemaining}.`,
            'EXCEEDS_BALANCE'
          );
        }
      }

      const dbData = this.mapToDb(updated);

      const { data, error } = await supabase
        .from('payments')
        .update(dbData)
        .eq('id', id)
        .select('*, loans(borrowers(full_name))')
        .single();

      let updatedRow = data;
      if (error) {
        console.warn('[PaymentService.update] Update with select failed, fallback to insert/update:', error.message);
        const { error: updateErr } = await supabase
          .from('payments')
          .update(dbData)
          .eq('id', id);

        if (updateErr) throw handleDbError(updateErr);

        updatedRow = {
          ...existingPayment,
          ...dbData,
        };
      }

      const updatedPayment = this.mapRow(updatedRow);

      await TimelineService.addTimelineEvent({
        loanId: targetLoanId,
        eventType: 'Payment Updated',
        title: 'Payment Updated',
        description: `Payment ${updatedPayment.id} updated (Receipt: ${updatedPayment.receiptNumber}). Amount: $${updatedPayment.amount}`,
        createdBy: user.id,
        metadata: {
          paymentId: updatedPayment.id,
          receiptNumber: updatedPayment.receiptNumber,
          amount: updatedPayment.amount,
        },
      });

      await this.recalculateLoanBalance(targetLoanId);
      await AgreementService.updateAgreementFinancialSummary(targetLoanId);

      if (existingPayment.loanId && existingPayment.loanId !== targetLoanId) {
        await this.recalculateLoanBalance(existingPayment.loanId);
        await AgreementService.updateAgreementFinancialSummary(existingPayment.loanId);
      }

      return updatedPayment;
    } catch (err) {
      if (err instanceof PaymentError) throw err;
      throw handleDbError(err);
    }
  }

  /**
   * Deletes a payment record and updates loan balance & status.
   */
  static async delete(id: string): Promise<void> {
    try {
      assertSupabaseSetup();
      const user = await getAuthenticatedUser();

      const existingPayment = await this.getById(id);

      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw handleDbError(error);

      if (existingPayment.loanId) {
        await TimelineService.addTimelineEvent({
          loanId: existingPayment.loanId,
          eventType: 'Payment Deleted',
          title: 'Payment Deleted',
          description: `Payment of $${existingPayment.amount} (Receipt: ${existingPayment.receiptNumber || existingPayment.id}) was deleted.`,
          createdBy: user.id,
          metadata: {
            paymentId: existingPayment.id,
            amount: existingPayment.amount,
            receiptNumber: existingPayment.receiptNumber,
          },
        });

        await this.recalculateLoanBalance(existingPayment.loanId);
        await AgreementService.updateAgreementFinancialSummary(existingPayment.loanId);
      }
    } catch (err) {
      if (err instanceof PaymentError) throw err;
      throw handleDbError(err);
    }
  }
}
