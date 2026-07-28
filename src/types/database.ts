export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      borrowers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          total_loans: number;
          pending_amount: number;
          status: 'Active' | 'Cleared' | 'Overdue';
          joined_date: string;
          national_id: string | null;
          address: string | null;
          occupation: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email: string;
          total_loans?: number;
          pending_amount?: number;
          status?: 'Active' | 'Cleared' | 'Overdue';
          joined_date?: string;
          national_id?: string | null;
          address?: string | null;
          occupation?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string;
          total_loans?: number;
          pending_amount?: number;
          status?: 'Active' | 'Cleared' | 'Overdue';
          joined_date?: string;
          national_id?: string | null;
          address?: string | null;
          occupation?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          borrower_id: string;
          borrower_name: string;
          amount: number;
          remaining_amount: number;
          purpose: string;
          loan_date: string;
          due_date: string;
          status: 'Active' | 'Fully Paid' | 'Overdue';
          currency: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          borrower_id: string;
          borrower_name: string;
          amount: number;
          remaining_amount: number;
          purpose: string;
          loan_date: string;
          due_date: string;
          status?: 'Active' | 'Fully Paid' | 'Overdue';
          currency?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          borrower_id?: string;
          borrower_name?: string;
          amount?: number;
          remaining_amount?: number;
          purpose?: string;
          loan_date?: string;
          due_date?: string;
          status?: 'Active' | 'Fully Paid' | 'Overdue';
          currency?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          loan_id: string;
          payment_amount: number;
          payment_date: string;
          payment_method: string;
          reference_number: string | null;
          notes: string | null;
          remaining_balance_after: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          payment_amount: number;
          payment_date?: string;
          payment_method?: string;
          reference_number?: string | null;
          notes?: string | null;
          remaining_balance_after?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          payment_amount?: number;
          payment_date?: string;
          payment_method?: string;
          reference_number?: string | null;
          notes?: string | null;
          remaining_balance_after?: number | null;
          created_at?: string;
        };
      };
      agreements: {
        Row: {
          id: string;
          loan_id: string;
          borrower_id: string | null;
          borrower_name: string;
          loan_amount: number;
          purpose: string;
          loan_date: string;
          due_date: string;
          witness_name: string | null;
          witness_phone: string | null;
          created_date: string;
          version: string;
          pdf_url: string | null;
          status: 'Signed' | 'Pending' | 'Draft' | 'Archived' | 'Active' | string;
          agreement_number: string | null;
          current_version: number | null;
          total_paid: number | null;
          remaining_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          borrower_id?: string | null;
          borrower_name: string;
          loan_amount: number;
          purpose: string;
          loan_date: string;
          due_date: string;
          witness_name?: string | null;
          witness_phone?: string | null;
          created_date?: string;
          version?: string;
          pdf_url?: string | null;
          status?: 'Signed' | 'Pending' | 'Draft' | 'Archived' | 'Active' | string;
          agreement_number?: string | null;
          current_version?: number | null;
          total_paid?: number | null;
          remaining_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          borrower_id?: string | null;
          borrower_name?: string;
          loan_amount?: number;
          purpose?: string;
          loan_date?: string;
          due_date?: string;
          witness_name?: string | null;
          witness_phone?: string | null;
          created_date?: string;
          version?: string;
          pdf_url?: string | null;
          status?: 'Signed' | 'Pending' | 'Draft' | 'Archived' | 'Active' | string;
          agreement_number?: string | null;
          current_version?: number | null;
          total_paid?: number | null;
          remaining_amount?: number | null;
          created_at?: string;
        };
      };
      agreement_versions: {
        Row: {
          id: string;
          agreement_id: string;
          version: string;
          created_date: string;
          created_by: string;
          status: 'Signed' | 'Pending' | 'Draft' | 'Archived';
          loan_amount: number;
          purpose: string;
          loan_date: string;
          due_date: string;
          witness_name: string | null;
          witness_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agreement_id: string;
          version: string;
          created_date?: string;
          created_by: string;
          status?: 'Signed' | 'Pending' | 'Draft' | 'Archived';
          loan_amount: number;
          purpose: string;
          loan_date: string;
          due_date: string;
          witness_name?: string | null;
          witness_phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agreement_id?: string;
          version?: string;
          created_date?: string;
          created_by?: string;
          status?: 'Signed' | 'Pending' | 'Draft' | 'Archived';
          loan_amount?: number;
          purpose?: string;
          loan_date?: string;
          due_date?: string;
          witness_name?: string | null;
          witness_phone?: string | null;
          created_at?: string;
        };
      };
      reminder_logs: {
        Row: {
          id: string;
          borrower_name: string;
          loan_id: string;
          reminder_date: string;
          status: 'Sent' | 'Pending' | 'Failed';
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          borrower_name: string;
          loan_id: string;
          reminder_date?: string;
          status?: 'Sent' | 'Pending' | 'Failed';
          note: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          borrower_name?: string;
          loan_id?: string;
          reminder_date?: string;
          status?: 'Sent' | 'Pending' | 'Failed';
          note?: string;
          created_at?: string;
        };
      };
      loan_timeline: {
        Row: {
          id: string;
          loan_id: string;
          event_type: string;
          title: string;
          description: string | null;
          metadata: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          event_type: string;
          title: string;
          description?: string | null;
          metadata?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          event_type?: string;
          title?: string;
          description?: string | null;
          metadata?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
