import { supabase } from '../lib/supabase';
import { ReminderLog } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';
import { TimelineService } from './TimelineService';

export class ReminderService {
  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any): ReminderLog {
    return {
      id: row.id,
      borrowerName: row.loans?.borrowers?.full_name || row.borrower_name || 'Unknown Borrower',
      loanId: row.loan_id,
      reminderDate: row.reminder_date || row.created_at,
      status: row.status || 'Pending',
      note: row.note,
    };
  }

  /**
   * Maps React UI model properties to database snake_case columns.
   */
  static mapToDb(item: Partial<ReminderLog>) {
    const dbObj: any = {};
    if (item.loanId !== undefined) dbObj.loan_id = item.loanId;
    if (item.reminderDate !== undefined) dbObj.reminder_date = item.reminderDate;
    if (item.status !== undefined) dbObj.status = item.status;
    if (item.note !== undefined) dbObj.note = item.note;
    return dbObj;
  }

  /**
   * Reads all reminders from the database.
   */
  static async getAll(): Promise<ReminderLog[]> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('*, loans(borrowers(full_name))')
        .order('reminder_date', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => this.mapRow(row));
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Reads a single reminder log.
   */
  static async getById(id: string): Promise<ReminderLog> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('*, loans(borrowers(full_name))')
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Creates a new reminder log.
   */
  static async create(reminder: Omit<ReminderLog, 'id' | 'reminderDate'>): Promise<ReminderLog> {
    try {
      assertSupabaseSetup();
      const dbData = this.mapToDb({
        ...reminder,
        reminderDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      const { data, error } = await supabase
        .from('reminder_logs')
        .insert(dbData)
        .select('*, loans(borrowers(full_name))')
        .single();

      if (error) throw error;
      const createdReminder = this.mapRow(data);

      if (createdReminder.loanId) {
        await TimelineService.addTimelineEvent({
          loanId: createdReminder.loanId,
          eventType: 'Reminder Sent',
          title: 'Reminder Sent',
          description: createdReminder.note || `Payment reminder sent to ${createdReminder.borrowerName}`,
          metadata: {
            reminderId: createdReminder.id,
            status: createdReminder.status,
          },
        });
      }

      return createdReminder;
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Updates an existing reminder.
   */
  static async update(id: string, updated: Partial<ReminderLog>): Promise<ReminderLog> {
    try {
      assertSupabaseSetup();
      const dbData = this.mapToDb(updated);
      const { data, error } = await supabase
        .from('reminder_logs')
        .update(dbData)
        .eq('id', id)
        .select('*, loans(borrowers(full_name))')
        .single();

      if (error) throw error;
      return this.mapRow(data);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Deletes a reminder log.
   */
  static async delete(id: string): Promise<void> {
    try {
      assertSupabaseSetup();
      const { error } = await supabase
        .from('reminder_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw handleDbError(err);
    }
  }
}
