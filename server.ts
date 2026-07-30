import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Endpoint: AI-Powered Agreement Document Generator
  app.post('/api/agreements/generate-doc', async (req, res) => {
    try {
      const {
        borrowerName = 'Borrower',
        lenderName = 'Amanah Lender',
        loanAmount = 0,
        currency = 'USD',
        purpose = 'Personal Loan',
        loanDate = '',
        dueDate = '',
        agreementNumber = 'AG-000000',
        createdDate = '',
        totalPaid = 0,
        remainingAmount = 0,
        paymentHistory = [],
      } = req.body || {};

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn('[Server] GEMINI_API_KEY environment variable is missing. Returning fallback signal.');
        return res.json({
          success: false,
          fallback: true,
          message: 'GEMINI_API_KEY not configured on server.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const formattedPayments = Array.isArray(paymentHistory) && paymentHistory.length > 0
        ? paymentHistory.map((p: any, idx: number) => 
            `Payment #${idx + 1}: ${p.date || 'N/A'} - Amount: ${currency} ${p.amount} via ${p.method || 'N/A'} (Ref/Receipt: ${p.receiptNumber || 'N/A'})`
          ).join('\n')
        : 'No payments recorded to date.';

      const prompt = `
Draft a comprehensive, formal, binding Legal Loan Agreement / Promissory Note document based on the following verified financial records:

- Borrower (Debtor): ${borrowerName}
- Lender (Creditor): ${lenderName}
- Agreement Reference Number: ${agreementNumber}
- Agreement Execution Date: ${createdDate || loanDate}
- Principal Loan Amount Advanced: ${currency} ${loanAmount}
- Purpose of Loan: ${purpose || 'General Financial Assistance'}
- Disbursal Date: ${loanDate}
- Agreed Repayment Due Date: ${dueDate}
- Total Amount Repaid to Date: ${currency} ${totalPaid}
- Current Outstanding Balance Remaining: ${currency} ${remainingAmount}

Verified Payment History Ledger:
${formattedPayments}

Instructions for Document Drafting:
1. Write in a formal, authoritative, legally binding tone suitable for court submission or formal notarization.
2. Divide the text into clear numbered sections (e.g., SECTION 1: COVENANT OF DEBT, SECTION 2: REPAYMENT SCHEDULE & LIVE LEDGER, SECTION 3: DEFAULT AND LEGAL REMEDIES, SECTION 4: GOVERNING LAW AND ACKNOWLEDGMENT).
3. Explicitly document the original loan, total repayments received so far, and the exact remaining balance owed by the borrower.
4. Include standard clauses for default, interest-free Islamic debt rules (Amanah compliance), prompt repayment obligation, and mutual legal acknowledgment.
5. Output ONLY plain text suitable for direct insertion into a PDF document. Do NOT use markdown code blocks (\`\`\`), HTML, or formatting symbols that look raw.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert legal counsel specializing in formal loan agreements and binding debt promissory notes. Write elegant, formal legal English.',
          temperature: 0.2,
        },
      });

      const generatedText = response.text || '';

      if (!generatedText) {
        return res.json({
          success: false,
          fallback: true,
          message: 'Model returned empty response.',
        });
      }

      return res.json({
        success: true,
        text: generatedText,
      });
    } catch (err: any) {
      console.error('[Server /api/agreements/generate-doc] Error calling Gemini API:', err?.message || err);
      return res.json({
        success: false,
        fallback: true,
        error: err?.message || 'Failed to generate legal document with Gemini API',
      });
    }
  });

  // Vite dev server middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
