import handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';
/* ---------- Types for finance summary ---------- */
export interface Transaction {
  id: number;
  amount_cents: number;
  reason: string;
  entered_by: number;
  staffFirstName: string;
  staffLastName: string;
  created_at: string; // ISO string, MDT/MST
}

export interface CashCount {
  id: number;
  balance_cents: number;
  counted_at: string;
  staff_id: number;
  staffFirstName: string;
  staffLastName: string;
  is_mismatch: boolean;
  diff_cents: number;
}

export interface Allowance {
  id: number;
  resident_id: number;
  period_start: string;
  period_end: string | null;
  amount_cents: number;
  created_at: string;
}

export interface Resident {
  id: number;
  firstName: string;
  lastName: string;
  groupHomeId: number;
}

export interface ResidentFinanceSummary {
  resident: Resident;
  latestCashCount: CashCount | null;
  runningBalance_cents: number;
  openAllowance: Allowance | null;
  transactions: Transaction[];
}
/**
 * Returns HTML for the resident's monthly transaction summary.
 * The caller (e.g., generatePdfDoc) can convert this HTML to PDF.
 */
export async function exportTransactionsHtml(summary: ResidentFinanceSummary): Promise<string> {
  const templatePath = path.join(process.cwd(), 'templates', 'transactionSummary.hbs');
  const templateSrc = await fs.readFile(templatePath, 'utf8');
  const template = handlebars.compile(templateSrc);

  const htmlBody = template({
    monthName: new Date().toLocaleString('en-CA', {
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Edmonton',
    }),
    transactions: summary.transactions,
    resident: summary.resident,
    runningBalance_cents: summary.runningBalance_cents,
    openAllowance: summary.openAllowance,
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Transactions – ${summary.resident.firstName} ${summary.resident.lastName}</title>
    <style>
      @page { size: A4; margin: 1.5cm; }
      body      { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 13px; color:#222; }
      h1        { font-size: 22px; margin-bottom: .4em; }
      table     { width:100%; border-collapse:collapse; font-size:0.9rem; }
      th, td    { padding:0.45rem 0.6rem; }
      thead     { background:#f3f4f6; text-transform:uppercase; font-size:0.75rem; letter-spacing:0.05em; }
      tbody tr.odd { background:#ffffff; }
      tbody tr.even{ background:#f9fafb; }
      .txt-right { text-align:right; }
      .plus  { color:#065f46; }
      .minus { color:#b91c1c; }
      .tx-header { margin-bottom:1em; }
      .tx-title  { margin:0 0 .3em 0; }
    </style>
  </head>
  <body>
    ${htmlBody}
  </body>
</html>`;
}
