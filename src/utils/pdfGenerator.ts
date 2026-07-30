import jsPDF from 'jspdf';
import { AgreementDetailsData } from '../types';

/**
 * Generates and downloads a formatted PDF agreement document.
 * If aiLegalText is provided, it incorporates the Gemini AI formal legal document body.
 * Otherwise, it uses the structured static covenant template.
 */
export const generateAgreementPDF = (data: AgreementDetailsData, aiLegalText?: string) => {
  const { agreement, lender, borrower, loan, financialSummary, payments, termsAndConditions, declaration } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const agreementNum = agreement.agreementNumber || agreement.id;
  const currency = loan.currency || 'USD';
  const createdDateStr = agreement.createdDate || new Date().toISOString().split('T')[0];

  const formatMoney = (amount: number) => {
    if (currency === 'BDT') {
      return `BDT ${amount.toLocaleString('en-IN')}`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  let y = 15;
  const pageWidth = 210;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 15;
      return true;
    }
    return false;
  };

  // --- HEADER SECTION ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(15, y, 180, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AMANAH LOAN AGREEMENT', pageWidth / 2, y + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(aiLegalText ? 'OFFICIAL AI-GENERATED LEGAL DEBT COVENANT' : 'OFFICIAL DEBT REPAYMENT COVENANT', pageWidth / 2, y + 16, { align: 'center' });

  y += 28;

  // --- AGREEMENT METADATA BAR ---
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(15, y, 180, 14, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text(`Agreement No: `, 18, y + 9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${agreementNum}`, 43, y + 9);

  doc.setTextColor(51, 65, 85);
  doc.text(`Date: `, 95, y + 9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${createdDateStr}`, 106, y + 9);

  doc.setTextColor(51, 65, 85);
  doc.text(`Status: `, 150, y + 9);
  if (financialSummary.agreementStatus === 'Completed') {
    doc.setTextColor(16, 185, 129); // emerald green
  } else {
    doc.setTextColor(79, 70, 229); // indigo
  }
  doc.text(`${financialSummary.agreementStatus}`, 163, y + 9);

  y += 20;

  // --- PARTIES SECTION (Lender & Borrower) ---
  const colWidth = 87;

  // Lender Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, colWidth, 38, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, colWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('LENDER DETAILS', 18, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${lender.name}`, 18, y + 14);
  doc.text(`Phone: ${lender.phone}`, 18, y + 20);
  doc.text(`Email: ${lender.email}`, 18, y + 26);
  const lenderAddrLines = doc.splitTextToSize(`Address: ${lender.address}`, colWidth - 6);
  doc.text(lenderAddrLines, 18, y + 32);

  // Borrower Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(108, y, colWidth, 38, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.rect(108, y, colWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('BORROWER DETAILS', 111, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${borrower.fullName}`, 111, y + 14);
  doc.text(`Phone: ${borrower.phone}`, 111, y + 20);
  doc.text(`Email: ${borrower.email}`, 111, y + 26);
  doc.text(`National ID: ${borrower.nationalId}`, 111, y + 32);

  y += 44;

  // --- LOAN DETAILS ---
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, 180, 22, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.rect(15, y, 180, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('LOAN PARAMETERS', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Loan ID: ${loan.loanNumber}`, 18, y + 12);
  doc.text(`Principal Amount: ${formatMoney(loan.loanAmount)}`, 70, y + 12);
  doc.text(`Disbursal Date: ${loan.loanDate}`, 140, y + 12);

  doc.text(`Purpose: ${loan.purpose}`, 18, y + 18);
  doc.text(`Maturity Due Date: ${loan.dueDate}`, 140, y + 18);

  y += 28;

  // --- LIVE FINANCIAL SUMMARY ---
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(15, y, 180, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(49, 46, 129); // indigo-900
  doc.text('LIVE FINANCIAL SUMMARY', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text(`Original Principal: ${formatMoney(financialSummary.originalLoanAmount)}`, 18, y + 13);
  doc.text(`Total Paid To Date: ${formatMoney(financialSummary.totalPaid)}`, 80, y + 13);

  if (financialSummary.remainingAmount === 0) {
    doc.setTextColor(16, 185, 129);
    doc.text(`Remaining Balance: ${formatMoney(0)} (Settled)`, 140, y + 13);
  } else {
    doc.setTextColor(180, 83, 9);
    doc.text(`Remaining Balance: ${formatMoney(financialSummary.remainingAmount)}`, 140, y + 13);
  }

  doc.setTextColor(71, 85, 105);
  doc.text(`Total Payments Count: ${financialSummary.numberOfPayments}`, 18, y + 18);
  doc.text(`Settlement Date: ${financialSummary.settlementDate || 'Pending Final Settlement'}`, 80, y + 18);

  y += 28;

  // --- AI LEGAL BODY TEXT OR STANDARD TERMS ---
  if (aiLegalText) {
    checkPageBreak(30);

    doc.setFillColor(243, 244, 246); // slate-100
    doc.setDrawColor(209, 213, 219);
    doc.rect(15, y, 180, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('LEGAL CONTRACT CLAUSES (AI DRAFTED)', 18, y + 5);

    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const paragraphs = aiLegalText.split('\n');
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) {
        y += 3;
        continue;
      }

      const isSectionHeader = /^(SECTION|ARTICLE|CLAUSE|[0-9]+\.)/i.test(trimmed);
      if (isSectionHeader) {
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
      }

      const lines = doc.splitTextToSize(trimmed, 180);
      for (const line of lines) {
        checkPageBreak(5);
        doc.text(line, 15, y);
        y += 4.5;
      }
      y += 2;
    }
    y += 6;
  }

  // --- PAYMENT HISTORY LEDGER ---
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PAYMENT HISTORY LEDGER', 15, y);
  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, y, 180, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Date', 18, y + 4.5);
  doc.text('Payment Amount', 50, y + 4.5);
  doc.text('Method', 90, y + 4.5);
  doc.text('Reference Number', 125, y + 4.5);
  doc.text('Remaining Balance', 165, y + 4.5);

  y += 6;

  if (payments.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, y, 180, 6, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No payment transactions recorded yet.', 18, y + 4.5);
    y += 6;
  } else {
    const displayPayments = payments.slice(0, 8);
    displayPayments.forEach((p, idx) => {
      checkPageBreak(6);
      doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
      doc.rect(15, y, 180, 5.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      doc.text(p.paymentDate || '', 18, y + 4);
      doc.setTextColor(16, 185, 129);
      doc.text(formatMoney(p.amount), 50, y + 4);
      doc.setTextColor(15, 23, 42);
      doc.text(p.method || 'N/A', 90, y + 4);
      doc.text(p.referenceNumber || p.transactionId || '—', 125, y + 4);
      doc.setTextColor(180, 83, 9);
      doc.text(formatMoney(p.remainingBalanceAfter), 165, y + 4);

      y += 5.5;
    });

    if (payments.length > 8) {
      checkPageBreak(6);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`+ ${payments.length - 8} earlier payment records archived in system database.`, 18, y + 3.5);
      y += 5;
    }
  }

  y += 5;

  // If no AI text was provided, render standard terms and declaration
  if (!aiLegalText) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('TERMS & CONDITIONS', 15, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    termsAndConditions.forEach((term) => {
      const splitLines = doc.splitTextToSize(term, 180);
      for (const line of splitLines) {
        checkPageBreak(4);
        doc.text(line, 15, y);
        y += 3.5;
      }
    });

    y += 4;

    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DECLARATION & CONSENSUS', 15, y);
    y += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const decLines = doc.splitTextToSize(`"${declaration}"`, 180);
    for (const line of decLines) {
      checkPageBreak(4);
      doc.text(line, 15, y);
      y += 3.5;
    }
    y += 6;
  }

  // --- SIGNATURES SECTION ---
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('SIGNATURES & ATTESTATION', 15, y);
  y += 6;

  const sigBoxWidth = 42;
  const sigBoxGap = 4;

  // 1. Lender
  let sigX = 15;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(sigX, y, sigBoxWidth, 22, 'FD');
  doc.line(sigX + 4, y + 14, sigX + sigBoxWidth - 4, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(lender.name, sigX + sigBoxWidth / 2, y + 11, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Lender Signature', sigX + sigBoxWidth / 2, y + 18, { align: 'center' });

  // 2. Borrower
  sigX += sigBoxWidth + sigBoxGap;
  doc.setFillColor(248, 250, 252);
  doc.rect(sigX, y, sigBoxWidth, 22, 'FD');
  doc.line(sigX + 4, y + 14, sigX + sigBoxWidth - 4, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(borrower.fullName, sigX + sigBoxWidth / 2, y + 11, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Borrower Signature', sigX + sigBoxWidth / 2, y + 18, { align: 'center' });

  // 3. Witness 1
  sigX += sigBoxWidth + sigBoxGap;
  doc.setFillColor(248, 250, 252);
  doc.rect(sigX, y, sigBoxWidth, 22, 'FD');
  doc.line(sigX + 4, y + 14, sigX + sigBoxWidth - 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(agreement.witnessName || 'Witness 1 Attest', sigX + sigBoxWidth / 2, y + 11, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Witness 1', sigX + sigBoxWidth / 2, y + 18, { align: 'center' });

  // 4. Witness 2
  sigX += sigBoxWidth + sigBoxGap;
  doc.setFillColor(248, 250, 252);
  doc.rect(sigX, y, sigBoxWidth, 22, 'FD');
  doc.line(sigX + 4, y + 14, sigX + sigBoxWidth - 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Witness 2 Attest', sigX + sigBoxWidth / 2, y + 11, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Witness 2', sigX + sigBoxWidth / 2, y + 18, { align: 'center' });

  y += 28;

  // --- FOOTER ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Digitally generated & verified by Amanah Loan Management System • ID: ${agreement.id}`, pageWidth / 2, 288, { align: 'center' });

  // Save the PDF with requested filename format: Agreement_{agreementNumber}_{date}.pdf
  const safeAgrNum = String(agreementNum).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = String(createdDateStr).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeFilename = `Agreement_${safeAgrNum}_${safeDate}.pdf`;

  doc.save(safeFilename);
};

/**
 * Downloads Agreement PDF with AI-generated legal text using Gemini API.
 * Gracefully falls back to standard static PDF template if Gemini API call fails.
 */
export const downloadAgreementWithAI = async (
  data: AgreementDetailsData,
  onLoadingChange?: (loading: boolean) => void
) => {
  if (onLoadingChange) onLoadingChange(true);

  try {
    const response = await fetch('/api/agreements/generate-doc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        borrowerName: data.borrower.fullName,
        lenderName: data.lender.name,
        loanAmount: data.loan.loanAmount,
        currency: data.loan.currency || 'USD',
        purpose: data.loan.purpose,
        loanDate: data.loan.loanDate,
        dueDate: data.loan.dueDate,
        agreementNumber: data.agreement.agreementNumber || data.agreement.id,
        createdDate: data.agreement.createdDate,
        totalPaid: data.financialSummary.totalPaid,
        remainingAmount: data.financialSummary.remainingAmount,
        paymentHistory: (data.payments || []).map((p) => ({
          date: p.paymentDate,
          amount: p.amount,
          method: p.method,
          receiptNumber: p.receiptNumber || p.referenceNumber,
        })),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.text) {
        console.log('[pdfGenerator] Gemini AI document generation succeeded!');
        generateAgreementPDF(data, result.text);
        return;
      }
    }

    console.warn('[pdfGenerator] Gemini API failed or returned fallback signal. Generating default agreement PDF.');
    generateAgreementPDF(data);
  } catch (err) {
    console.warn('[pdfGenerator] Error connecting to Gemini API endpoint. Generating fallback PDF:', err);
    generateAgreementPDF(data);
  } finally {
    if (onLoadingChange) onLoadingChange(false);
  }
};
