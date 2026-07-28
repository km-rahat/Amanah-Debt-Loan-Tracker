import { supabase } from '../lib/supabase';
import { Borrower } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';

export class BorrowerService {
  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any): Borrower {
    const loans = row.loans || [];
    const totalLoans = loans.length;
    const pendingAmount = loans.reduce((sum: number, l: any) => {
      const loanAmount = Number(l.loan_amount ?? l.amount ?? 0);
      let rem: number;
      if (Array.isArray(l.payments)) {
        const totalPaid = l.payments.reduce((s: number, p: any) => s + Number(p.payment_amount ?? 0), 0);
        rem = Math.max(0, Math.round((loanAmount - totalPaid) * 100) / 100);
      } else if (l.remaining_amount !== undefined && l.remaining_amount !== null) {
        rem = Math.max(0, Number(l.remaining_amount));
      } else {
        rem = loanAmount;
      }
      return sum + rem;
    }, 0);

    return {
      id: row.id,
      name: row.full_name || row.name || 'Unknown Borrower',
      phone: row.phone,
      email: row.email,
      totalLoans: totalLoans,
      pendingAmount: pendingAmount,
      status: row.status || 'Active',
      joinedDate: row.joined_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      nationalId: row.national_id || undefined,
      address: row.address || undefined,
      occupation: row.occupation || undefined,
      notes: row.notes || undefined,
      user_id: row.user_id || undefined,
    };
  }

  /**
   * Maps React UI model properties to database snake_case columns.
   */
  static mapToDb(item: Partial<Borrower>) {
    const dbObj: any = {};
    if (item.name !== undefined) dbObj.full_name = item.name;
    if (item.phone !== undefined) dbObj.phone = item.phone;
    if (item.email !== undefined) dbObj.email = item.email;
    if (item.status !== undefined) dbObj.status = item.status;
    if (item.nationalId !== undefined) dbObj.national_id = item.nationalId;
    if (item.address !== undefined) dbObj.address = item.address;
    if (item.occupation !== undefined) dbObj.occupation = item.occupation;
    if (item.notes !== undefined) dbObj.notes = item.notes;
    if (item.user_id !== undefined) dbObj.user_id = item.user_id;
    return dbObj;
  }

  /**
   * Reads all borrowers from the database.
   */
  static async getAll(): Promise<Borrower[]> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('borrowers')
        .select('*, loans(*, payments(payment_amount))')
        .order('full_name', { ascending: true });

      if (error) {
        // Fallback: fetch borrowers and loans + payments separately if nested query fails
        const { data: fbData, error: fbErr } = await supabase
          .from('borrowers')
          .select('*')
          .order('full_name', { ascending: true });
        if (fbErr) throw fbErr;

        const { data: allLoans } = await supabase
          .from('loans')
          .select('*, payments(payment_amount)');

        const loansByBorrowerId: Record<string, any[]> = {};
        (allLoans || []).forEach((l: any) => {
          if (!loansByBorrowerId[l.borrower_id]) loansByBorrowerId[l.borrower_id] = [];
          loansByBorrowerId[l.borrower_id].push(l);
        });

        return (fbData || []).map((row: any) => {
          return this.mapRow({
            ...row,
            loans: loansByBorrowerId[row.id] || [],
          });
        });
      }
      return (data || []).map((row: any) => this.mapRow(row));
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Reads a single borrower by their unique ID.
   */
  static async getById(id: string): Promise<Borrower> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('borrowers')
        .select('*, loans(*, payments(payment_amount))')
        .eq('id', id)
        .single();

      if (error) {
        const { data: fbData, error: fbErr } = await supabase
          .from('borrowers')
          .select('*')
          .eq('id', id)
          .single();
        if (fbErr) throw fbErr;

        const { data: borrowerLoans } = await supabase
          .from('loans')
          .select('*, payments(payment_amount)')
          .eq('borrower_id', id);

        return this.mapRow({
          ...fbData,
          loans: borrowerLoans || [],
        });
      }
      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Creates a new borrower record.
   */
  static async create(borrower: Omit<Borrower, 'id' | 'totalLoans' | 'pendingAmount' | 'joinedDate'>): Promise<Borrower> {
    try {
      assertSupabaseSetup();

      let authUserId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          authUserId = user.id;
        }
      } catch (authErr) {
        console.warn('Could not retrieve auth user ID for borrower:', authErr);
      }

      const dbData = this.mapToDb({
        ...borrower,
        user_id: authUserId,
      });

      const { data, error } = await supabase
        .from('borrowers')
        .insert(dbData)
        .select('*, loans(*, payments(payment_amount))')
        .single();

      if (error) throw error;
      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Updates an existing borrower record.
   */
  static async update(id: string, updated: Partial<Borrower>): Promise<Borrower> {
    try {
      assertSupabaseSetup();
      const dbData = this.mapToDb(updated);
      const { data, error } = await supabase
        .from('borrowers')
        .update(dbData)
        .eq('id', id)
        .select('*, loans(*, payments(payment_amount))')
        .single();

      if (error) throw error;
      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Deletes a borrower record by ID.
   */
  static async delete(id: string): Promise<void> {
    try {
      assertSupabaseSetup();
      const { error } = await supabase
        .from('borrowers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw handleDbError(err);
    }
  }
}
