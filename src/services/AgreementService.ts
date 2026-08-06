import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Agreement, AgreementVersion, AgreementDetailsData } from '../types';
import { assertSupabaseSetup, handleDbError } from './base';
import { TimelineService } from './TimelineService';
import { PaymentService } from './PaymentService';

export class AgreementService {
  /**
   * Maps database snake_case row to camelCase React UI interface.
   */
  static mapRow(row: any, versions: AgreementVersion[] = []): Agreement {
    const loan = row.loans || {};
    const borrower = loan.borrowers || {};

    return {
      id: row.id,
      loanId: row.loan_id,
      borrowerId: borrower.id || undefined,
      borrowerName: borrower.full_name || row.borrower_name || 'Unknown Borrower',
      loanAmount: loan.loan_amount || row.loan_amount || 0,
      purpose: loan.purpose || row.purpose || '',
      loanDate: loan.loan_date || row.loan_date || '',
      dueDate: loan.due_date || row.due_date || '',
      witnessName: row.witness_name || undefined,
      witnessPhone: row.witness_phone || undefined,
      createdDate: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      version: row.version || `v1.${versions.length}`,
      pdfUrl: undefined,
      status: row.status || 'Active',
      agreementNumber: row.agreement_number || undefined,
      currentVersion: row.current_version || 1,
      totalPaid: row.total_paid || 0,
      remainingAmount: row.remaining_amount ?? loan.loan_amount ?? row.loan_amount ?? 0,
      versions: versions,
    };
  }

  /**
   * Maps database snake_case row to camelCase React UI AgreementVersion interface.
   */
  static mapVersionRow(row: any): AgreementVersion {
    let parsedContent: any = {};
    try {
      parsedContent = typeof row.content === 'string' ? JSON.parse(row.content) : (row.content || {});
    } catch (e) {
      console.error('Failed to parse agreement version content:', e);
    }

    return {
      version: parsedContent.version || 'v1.0',
      createdDate: parsedContent.created_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdBy: parsedContent.created_by || 'System User',
      status: parsedContent.status || 'Pending',
      loanAmount: parsedContent.loan_amount || 0,
      purpose: parsedContent.purpose || '',
      loanDate: parsedContent.loan_date || '',
      dueDate: parsedContent.due_date || '',
      witnessName: parsedContent.witness_name || undefined,
      witnessPhone: parsedContent.witness_phone || undefined,
    };
  }

  /**
   * Maps React UI model properties to database snake_case columns.
   */
  static mapToDb(item: Partial<Agreement>) {
    const dbObj: any = {};
    if (item.loanId !== undefined) dbObj.loan_id = item.loanId;
    if (item.witnessName !== undefined) dbObj.witness_name = item.witnessName;
    if (item.witnessPhone !== undefined) dbObj.witness_phone = item.witnessPhone;
    if (item.status !== undefined) dbObj.status = item.status;
    return dbObj;
  }

  /**
   * Reads all agreements, including their related versions.
   */
  static async getAll(): Promise<Agreement[]> {
    try {
      assertSupabaseSetup();
      
      // Fetch agreements
      const { data: agData, error: agError } = await supabase
        .from('agreements')
        .select('*, loans(*, borrowers(*))')
        .order('created_at', { ascending: false });

      if (agError) throw agError;

      // Fetch agreement versions
      const { data: verData, error: verError } = await supabase
        .from('agreement_versions')
        .select('*');

      if (verError) throw verError;

      const results: Agreement[] = [];

      for (const row of (agData || [])) {
        const associatedVersions = (verData || [])
          .filter((v: any) => v.agreement_id === row.id)
          .map((v: any) => this.mapVersionRow(v));
        results.push(this.mapRow(row, associatedVersions));
      }

      return results;
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Reads a single agreement by ID.
   */
  static async getById(id: string): Promise<Agreement> {
    try {
      assertSupabaseSetup();
      const { data, error } = await supabase
        .from('agreements')
        .select('*, loans(*, borrowers(*))')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: verData, error: verError } = await supabase
        .from('agreement_versions')
        .select('*')
        .eq('agreement_id', id);

      if (verError) throw verError;

      const versions = (verData || []).map((v: any) => this.mapVersionRow(v));
      return this.mapRow(data, versions);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Creates a new agreement record at v1.0.
   */
  static async create(agreement: Omit<Agreement, 'id' | 'createdDate' | 'version'> & { status: Agreement['status'] }): Promise<Agreement> {
    try {
      assertSupabaseSetup();
      const dbData = this.mapToDb(agreement);
      const { data, error } = await supabase
        .from('agreements')
        .insert(dbData)
        .select('*, loans(*, borrowers(*))')
        .single();

      if (error) throw error;
      const createdAgreement = this.mapRow(data);

      if (createdAgreement.loanId) {
        await TimelineService.addTimelineEvent({
          loanId: createdAgreement.loanId,
          eventType: 'Agreement Generated',
          title: 'Agreement Generated',
          description: `Debt settlement agreement generated for ${createdAgreement.borrowerName} (${createdAgreement.version})`,
          metadata: {
            agreementId: createdAgreement.id,
            status: createdAgreement.status,
            version: createdAgreement.version,
          },
        });
      }

      return createdAgreement;
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Updates an agreement, optionally saving a copy of the previous state as an immutable version snapshot.
   */
  static async update(id: string, updated: Partial<Agreement>, createNewVersion = false, authorName = 'System User'): Promise<Agreement> {
    try {
      assertSupabaseSetup();

      const { data: current, error: getErr } = await supabase
        .from('agreements')
        .select('*, loans(*, borrowers(*))')
        .eq('id', id)
        .single();

      if (getErr) throw getErr;

      const { data: verDataList, error: listErr } = await supabase
        .from('agreement_versions')
        .select('*')
        .eq('agreement_id', id);

      const currentVerCount = verDataList?.length || 0;

      if (createNewVersion) {
        const loan = current.loans || {};
        const borrower = loan.borrowers || {};

        // 1. Snapshot previous state into agreement_versions
        const versionSnapshot = {
          agreement_id: current.id,
          content: JSON.stringify({
            version: `v1.${currentVerCount}`,
            created_date: current.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            created_by: authorName,
            status: current.status,
            loan_amount: loan.loan_amount || 0,
            purpose: loan.purpose || '',
            loan_date: loan.loan_date || '',
            due_date: loan.due_date || '',
            witness_name: current.witness_name,
            witness_phone: current.witness_phone,
          })
        };

        const { error: insertVerErr } = await supabase
          .from('agreement_versions')
          .insert(versionSnapshot);

        if (insertVerErr) throw insertVerErr;
      }

      // 2. Update the main agreements table
      const dbData = this.mapToDb(updated);
      const { data: updatedRow, error: updateErr } = await supabase
        .from('agreements')
        .update(dbData)
        .eq('id', id)
        .select('*, loans(*, borrowers(*))')
        .single();

      if (updateErr) throw updateErr;

      // Reload versions
      const { data: verData, error: verError } = await supabase
        .from('agreement_versions')
        .select('*')
        .eq('agreement_id', id);

      if (verError) throw verError;

      const versions = (verData || []).map((v: any) => this.mapVersionRow(v));
      return this.mapRow(updatedRow, versions);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Restores an agreement to a specific historical version.
   */
  static async restoreVersion(id: string, targetVersion: string): Promise<Agreement> {
    try {
      assertSupabaseSetup();

      const { data: verDataList, error: listErr } = await supabase
        .from('agreement_versions')
        .select('*')
        .eq('agreement_id', id);

      if (listErr) throw listErr;

      const versionRow = (verDataList || []).find((v: any) => {
        const parsed = this.mapVersionRow(v);
        return parsed.version === targetVersion;
      });

      if (!versionRow) {
        throw new Error(`Historical version ${targetVersion} not found.`);
      }

      const parsedVersion = this.mapVersionRow(versionRow);

      const restoredValues: Partial<Agreement> = {
        witnessName: parsedVersion.witnessName || undefined,
        witnessPhone: parsedVersion.witnessPhone || undefined,
        status: parsedVersion.status,
      };

      const dbData = this.mapToDb(restoredValues);
      const { data: updatedRow, error: updateErr } = await supabase
        .from('agreements')
        .update(dbData)
        .eq('id', id)
        .select('*, loans(*, borrowers(*))')
        .single();

      if (updateErr) throw updateErr;

      const versions = (verDataList || []).map((v: any) => this.mapVersionRow(v));
      return this.mapRow(updatedRow, versions);
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Deletes an agreement by ID.
   */
  static async delete(id: string): Promise<void> {
    try {
      assertSupabaseSetup();
      // agreement_versions is foreign-keyed to agreements with cascade delete ideally,
      // but let's delete versions first to be robust.
      await supabase
        .from('agreement_versions')
        .delete()
        .eq('agreement_id', id);

      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw handleDbError(err);
    }
  }

  /**
   * Automatically generates an agreement number formatted like AG-YYYY-000001
   * Supports an extra offset/randomizer to prevent race conditions during rapid calls
   */
  static async generateAgreementNumber(extraOffset = 0): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AG-${year}-`;
    try {
      assertSupabaseSetup();
      const { data } = await supabase
        .from('agreements')
        .select('agreement_number');

      let maxSeq = 0;
      if (data && data.length > 0) {
        for (const row of data) {
          if (row.agreement_number && typeof row.agreement_number === 'string') {
            const numPart = row.agreement_number.replace(/[^0-9]/g, '');
            if (numPart) {
              const seq = parseInt(numPart.slice(-6), 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        }
        if (maxSeq === 0) {
          maxSeq = data.length;
        }
      }

      const nextSeq = maxSeq + 1 + extraOffset;
      // Add a 2-digit random suffix if extraOffset > 0 to ensure uniqueness under race conditions
      if (extraOffset > 0) {
        const rand = Math.floor(10 + Math.random() * 90);
        return `${prefix}${String(nextSeq).padStart(5, '0')}-${rand}`;
      }
      return `${prefix}${String(nextSeq).padStart(6, '0')}`;
    } catch (err) {
      console.warn('Could not query existing agreement numbers, using timestamp default:', err);
      const timeMs = Date.now().toString().slice(-6);
      return `${prefix}${timeMs}`;
    }
  }

  /**
   * Automatically creates a single agreement for a loan if one does not already exist.
   * Retries up to 3 times if race conditions or unique constraint collisions occur.
   */
  static async autoGenerateForLoan(loan: {
    id: string;
    borrowerId?: string;
    borrowerName: string;
    amount: number;
    purpose: string;
    loanDate: string;
    dueDate: string;
  }): Promise<Agreement | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured.');
      }
      assertSupabaseSetup();

      // 1. Check if an agreement already exists for this loan_id
      const { data: existing, error: checkErr } = await supabase
        .from('agreements')
        .select('*, loans(*, borrowers(*))')
        .eq('loan_id', loan.id);

      if (!checkErr && existing && existing.length > 0) {
        console.log(`[AgreementService.autoGenerateForLoan] Agreement already exists for loan ${loan.id}. Returning existing agreement.`);
        return this.mapRow(existing[0]);
      }

      let agreementRow: any = null;
      let finalAgreementNumber = '';
      let lastInsertError: any = null;

      // 2. Retry loop (3 attempts) to handle potential race condition / duplicate agreement numbers
      for (let attempt = 0; attempt < 3; attempt++) {
        const agreementNumber = await this.generateAgreementNumber(attempt);
        finalAgreementNumber = agreementNumber;

        const insertPayload: any = {
          loan_id: loan.id,
          borrower_id: loan.borrowerId || null,
          borrower_name: loan.borrowerName || 'Unknown Borrower',
          loan_amount: loan.amount || 0,
          purpose: loan.purpose || '',
          loan_date: loan.loanDate || new Date().toISOString().split('T')[0],
          due_date: loan.dueDate || new Date().toISOString().split('T')[0],
          agreement_number: agreementNumber,
          version: '1',
          status: 'Active',
          created_at: new Date().toISOString(),
          created_date: new Date().toISOString().split('T')[0],
          current_version: 1,
          total_paid: 0,
          remaining_amount: loan.amount || 0,
        };

        console.log(`[AgreementService.autoGenerateForLoan] Attempt ${attempt + 1}: Inserting agreement:`, agreementNumber);

        const { data, error } = await supabase
          .from('agreements')
          .insert(insertPayload)
          .select('*, loans(*, borrowers(*))')
          .single();

        if (!error && data) {
          agreementRow = data;
          break; // Success!
        }

        lastInsertError = error;
        console.warn(`[AgreementService.autoGenerateForLoan] Insert attempt ${attempt + 1} failed (${error?.message}). Attempting fallback payload...`);

        // Attempt fallback insert with REQUIRED agreement_number included
        const fallbackPayload = {
          loan_id: loan.id,
          agreement_number: agreementNumber,
          borrower_name: loan.borrowerName || 'Unknown Borrower',
          loan_amount: loan.amount || 0,
          status: 'Active',
          total_paid: 0,
          remaining_amount: loan.amount || 0,
        };

        const { data: fbData, error: fbError } = await supabase
          .from('agreements')
          .insert(fallbackPayload)
          .select('*, loans(*, borrowers(*))')
          .single();

        if (!fbError && fbData) {
          agreementRow = fbData;
          break; // Fallback succeeded!
        }

        lastInsertError = fbError || error;
      }

      if (!agreementRow) {
        console.error('[AgreementService.autoGenerateForLoan] All insert attempts failed:', lastInsertError);
        throw new Error(lastInsertError?.message || 'Failed to insert agreement into database after retries');
      }

      console.log('[AgreementService.autoGenerateForLoan] Successfully created agreement row:', agreementRow);

      const createdAgreement = this.mapRow(agreementRow);
      if (!createdAgreement.agreementNumber) {
        createdAgreement.agreementNumber = finalAgreementNumber;
      }

      // 3. Create timeline event: Agreement Generated
      await TimelineService.addTimelineEvent({
        loanId: loan.id,
        eventType: 'Agreement Generated',
        title: 'Agreement Generated',
        description: `Official agreement ${finalAgreementNumber} generated for ${loan.borrowerName} (Loan Amount: $${(loan.amount || 0).toLocaleString()}).`,
        metadata: {
          agreementNumber: finalAgreementNumber,
          loanId: loan.id,
          loanAmount: loan.amount,
          status: 'Active',
        },
      });

      return createdAgreement;
    } catch (err: any) {
      console.error('[AgreementService.autoGenerateForLoan] Error creating agreement:', err);
      throw err;
    }
  }

  /**
   * Reusable function to recalculate financial metrics for a loan's agreement.
   * Auto updates: Total Paid, Remaining Amount, Number of Payments, Last Payment Date,
   * Agreement Status, Settlement Date, Completed At.
   * Reused after Payment Create, Payment Update, Payment Delete.
   */
  static async updateAgreementFinancialSummary(loanId: string): Promise<Agreement | null> {
    try {
      assertSupabaseSetup();
      if (!loanId) return null;

      // 1. Fetch related agreement for this loan
      const { data: agreementRow, error: agErr } = await supabase
        .from('agreements')
        .select('*, loans(*)')
        .eq('loan_id', loanId)
        .limit(1)
        .maybeSingle();

      if (agErr || !agreementRow) {
        console.warn(`[AgreementService] No agreement found for loan ${loanId} to update financial summary.`);
        return null;
      }

      // 2. Fetch current loan details
      const loanRow = agreementRow.loans || {};
      const { data: loanData } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();
      const currentLoan = loanData || loanRow;

      const originalLoanAmount = Number(currentLoan.loan_amount ?? currentLoan.amount ?? agreementRow.loan_amount ?? 0);

      // 3. Fetch all payments for this loan
      const { data: paymentsData, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });

      if (payErr) {
        console.warn(`[AgreementService] Error fetching payments for loan ${loanId}:`, payErr.message);
      }

      const paymentsList = paymentsData || [];
      const numberOfPayments = paymentsList.length;

      // Calculate Total Paid = SUM(payment_amount)
      const totalPaid = paymentsList.reduce((sum: number, p: any) => {
        return sum + Number(p.payment_amount ?? 0);
      }, 0);

      // Calculate Remaining Amount
      const remainingAmount = Math.max(0, originalLoanAmount - totalPaid);

      // Determine Last Payment Date
      const lastPaymentDate = numberOfPayments > 0
        ? (paymentsList[0].payment_date || (paymentsList[0].created_at ? paymentsList[0].created_at.split('T')[0] : null))
        : null;

      // Determine Agreement Status:
      // If Total Paid = 0 -> Status = Active
      // If Remaining Amount > 0 and Total Paid > 0 -> Status = Partially Paid
      // If Remaining Amount = 0 -> Status = Completed
      let status = 'Active';
      if (remainingAmount === 0 && originalLoanAmount > 0) {
        status = 'Completed';
      } else if (totalPaid > 0 && remainingAmount > 0) {
        status = 'Partially Paid';
      } else {
        status = 'Active';
      }

      const isCompleted = remainingAmount === 0 && originalLoanAmount > 0;
      const settlementDate = isCompleted ? (lastPaymentDate || new Date().toISOString().split('T')[0]) : null;
      const completedAt = isCompleted ? (agreementRow.completed_at || new Date().toISOString()) : null;

      // Prepare DB update payload
      const updatePayload: any = {
        total_paid: totalPaid,
        remaining_amount: remainingAmount,
        status: status,
      };

      if ('number_of_payments' in agreementRow) updatePayload.number_of_payments = numberOfPayments;
      if ('last_payment_date' in agreementRow) updatePayload.last_payment_date = lastPaymentDate;
      if ('settlement_date' in agreementRow) updatePayload.settlement_date = settlementDate;
      if ('completed_at' in agreementRow) updatePayload.completed_at = completedAt;

      let updatedRow: any = null;

      const { data: updatedData, error: updateErr } = await supabase
        .from('agreements')
        .update(updatePayload)
        .eq('id', agreementRow.id)
        .select('*, loans(*, borrowers(*))')
        .single();

      if (updateErr) {
        // Fallback to base columns if schema doesn't have extended columns
        const fallbackPayload = {
          total_paid: totalPaid,
          remaining_amount: remainingAmount,
          status: status,
        };
        const { data: fbData } = await supabase
          .from('agreements')
          .update(fallbackPayload)
          .eq('id', agreementRow.id)
          .select('*, loans(*, borrowers(*))')
          .single();

        updatedRow = fbData;
      } else {
        updatedRow = updatedData;
      }

      if (!updatedRow) {
        return null;
      }

      // Record a new version snapshot in agreement_versions table
      try {
        const { data: currentVersions } = await supabase
          .from('agreement_versions')
          .select('id')
          .eq('agreement_id', agreementRow.id);

        const verCount = (currentVersions || []).length;
        const newVerStr = `v1.${verCount + 1}`;

        const snapshotData = {
          agreement_id: agreementRow.id,
          version: newVerStr,
          created_date: new Date().toISOString().split('T')[0],
          content: JSON.stringify({
            version: newVerStr,
            updatedAt: new Date().toISOString(),
            status: status,
            totalPaid: totalPaid,
            remainingAmount: remainingAmount,
            numberOfPayments: numberOfPayments,
            lastPaymentDate: lastPaymentDate,
            note: `Payment ledger updated: Paid $${totalPaid}, Remaining $${remainingAmount}`,
          }),
        };

        await supabase.from('agreement_versions').insert(snapshotData);
        console.log(`[AgreementService] Version snapshot ${newVerStr} created for agreement ${agreementRow.id}`);
      } catch (verErr) {
        console.warn('[AgreementService] Version snapshot recording note:', verErr);
      }

      return this.mapRow(updatedRow);
    } catch (err) {
      console.error('Failed to update agreement financial summary:', err);
      return null;
    }
  }

  /**
   * Reads complete agreement details including borrower, loan, live financial summary,
   * live payment ledger, and static terms & conditions.
   * Requirement: Load agreement using AgreementService only.
   */
  static async getAgreementDetails(idOrNumber: string): Promise<AgreementDetailsData | null> {
    try {
      assertSupabaseSetup();

      if (!idOrNumber) return null;

      // 1. Fetch agreement by id OR agreement_number OR loan_id
      const { data, error } = await supabase
        .from('agreements')
        .select('*, loans(*, borrowers(*))')
        .or(`id.eq.${idOrNumber},agreement_number.eq.${idOrNumber},loan_id.eq.${idOrNumber}`)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Agreement lookup query error:', error.message);
      }

      let agreementRow = data;

      // Fallback: If not found by exact .or() string, query all agreements and search locally
      if (!agreementRow) {
        const { data: allAgreements } = await supabase
          .from('agreements')
          .select('*, loans(*, borrowers(*))');
        if (allAgreements && allAgreements.length > 0) {
          agreementRow = allAgreements.find(
            (a: any) =>
              a.id === idOrNumber ||
              a.agreement_number === idOrNumber ||
              a.loan_id === idOrNumber
          );
        }
      }

      if (!agreementRow) {
        return null;
      }

      // Fetch agreement versions
      const { data: verData } = await supabase
        .from('agreement_versions')
        .select('*')
        .eq('agreement_id', agreementRow.id);

      const versions = (verData || []).map((v: any) => this.mapVersionRow(v));
      const agreement = this.mapRow(agreementRow, versions);

      // Extract nested loan and borrower objects
      const loanRow = agreementRow.loans || {};
      const borrowerRow = loanRow.borrowers || {};
      const loanId = agreementRow.loan_id || loanRow.id;

      // 2. Fetch payments for this loan to build live payment ledger and financial summary
      let paymentsData: any[] = [];
      if (loanId) {
        const { data: pData } = await supabase
          .from('payments')
          .select('*, loans(borrowers(full_name))')
          .eq('loan_id', loanId)
          .order('payment_date', { ascending: true }); // Chronological for running balance

        paymentsData = pData || [];
      }

      const originalLoanAmount = Number(loanRow.loan_amount ?? agreementRow.loan_amount ?? agreement.loanAmount ?? 0);

      // Calculate running balance per payment
      let runningBalance = originalLoanAmount;
      const ledgerPaymentsChronological = paymentsData.map((pRow: any) => {
        const paymentObj = PaymentService.mapRow(pRow);
        runningBalance = Math.max(0, runningBalance - paymentObj.amount);
        return {
          ...paymentObj,
          remainingBalanceAfter: runningBalance,
        };
      });

      const totalPaid = ledgerPaymentsChronological.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = Math.max(0, originalLoanAmount - totalPaid);

      // Sort ledger payments newest first
      const paymentsNewestFirst = [...ledgerPaymentsChronological].reverse();

      const lastPaymentDate = paymentsNewestFirst.length > 0 ? paymentsNewestFirst[0].paymentDate : null;
      const isFullyPaid = remainingAmount === 0 && originalLoanAmount > 0;
      const settlementDate = isFullyPaid ? lastPaymentDate : null;

      // Determine live agreement status:
      // Status updates to 'Completed' / 'Settled' when fully paid, or remains active/signed
      let agreementStatus = agreementRow.status || 'Active';
      if (isFullyPaid) {
        agreementStatus = 'Completed';
      }

      // Borrower information
      const borrowerInfo = {
        fullName: borrowerRow.full_name || borrowerRow.name || agreementRow.borrower_name || agreement.borrowerName || 'N/A',
        phone: borrowerRow.phone || 'N/A',
        email: borrowerRow.email || 'N/A',
        nationalId: borrowerRow.national_id || 'N/A',
        address: borrowerRow.address || 'N/A',
      };

      // Loan information
      const loanInfo = {
        loanNumber: loanId || 'N/A',
        purpose: loanRow.purpose || agreementRow.purpose || agreement.purpose || 'N/A',
        loanAmount: originalLoanAmount,
        loanDate: loanRow.loan_date || agreementRow.loan_date || agreement.loanDate || 'N/A',
        dueDate: loanRow.due_date || agreementRow.due_date || agreement.dueDate || 'N/A',
        currency: loanRow.currency || 'USD',
      };

      // Financial summary
      const financialSummary = {
        originalLoanAmount,
        totalPaid,
        remainingAmount,
        numberOfPayments: paymentsNewestFirst.length,
        lastPaymentDate,
        agreementStatus,
        settlementDate,
      };

      // Terms & Conditions (display agreement terms)
      const termsAndConditions = [
        `1. Principal Acknowledgment: Borrower acknowledges receipt of the full principal loan amount (${loanInfo.currency} ${originalLoanAmount.toLocaleString()}) on ${loanInfo.loanDate}.`,
        `2. Settlement Obligation: Borrower covenants to fulfill all financial obligations and satisfy the principal debt on or before ${loanInfo.dueDate}.`,
        `3. Instalments & Ledger: Partial payments and instalments are credited towards reducing the remaining balance, reflected in real-time in the official ledger.`,
        `4. Immutable Document: The core contractual terms of this debt covenant remain fixed and unaltered. Live financial metrics dynamically track repayment progress.`,
        `5. Binding Consensus: Both Lender and Borrower affirm that this agreement represents a legally binding commitment governed under Amanah system rules.`,
      ];

      // Lender information
      const lenderInfo = {
        name: 'Amanah Financial Services',
        phone: '+1 (800) 555-0199',
        email: 'compliance@amanah.io',
        address: '100 Financial Plaza, Suite 400, New York, NY 10005',
      };

      // Declaration text
      const declaration =
        'Both the Lender and Borrower hereby declare and solemnly affirm that they have reviewed, acknowledged, and agreed to all terms, principal amounts, and repayment schedules specified in this Loan Agreement. Furthermore, both parties consent that all financial transactions, repayments, and live balance metrics recorded within the Amanah system serve as an authoritative, immutable legal record of the debt status.';

      return {
        agreement: {
          ...agreement,
          agreementNumber: agreementRow.agreement_number || agreement.agreementNumber || agreementRow.id,
          status: agreementStatus as any,
          totalPaid,
          remainingAmount,
        },
        lender: lenderInfo,
        borrower: borrowerInfo,
        loan: loanInfo,
        financialSummary,
        payments: paymentsNewestFirst,
        termsAndConditions,
        declaration,
      };
    } catch (err) {
      console.error('Error fetching agreement details:', err);
      throw handleDbError(err);
    }
  }
}

