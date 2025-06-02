/* -------------------------------------------------------------
 * Finance domain TypeScript interfaces  (snake-case to match DB)
 * -------------------------------------------------------------
 */

/* ---------- cash_allowances ---------- */
export interface CashAllowanceInsert {
  resident_id: number;
  /** ISO date “YYYY-MM-DD” */
  period_start: string;
  /** ISO date or undefined when period still open */
  period_end?: string | null;
  /** Credited amount – cents (e.g. 100 000 = $1 000.00) */
  amount_cents: number;
}

export interface CashAllowanceFetch extends CashAllowanceInsert {
  id: number;
  created_at: string; // DB timestamp ISO
}

/* ---------- cash_transactions ---------- */
export interface CashTransactionInsert {
  resident_id: number;
  /** Signed cents: positive = credit, negative = debit */
  amount_cents: number;
  reason?: string | null;
  entered_by: number; // staff FK
  allowance_id?: number; // nullable FK
}

export interface CashTransactionFetch extends CashTransactionInsert {
  id: number;
  created_at: string;
}

/* ---------- cash_counts (reconciliations) ---------- */
export interface CashCountInsert {
  resident_id: number;
  balance_cents: number; // cash on hand
  staff_id: number; // who counted
  counted_at?: string; // ISO, defaults to now on server
}

export interface CashCountFetch extends CashCountInsert {
  id: number;
  diff_cents: number | null; // balance − running ledger
  is_mismatch: boolean;
  counted_at: string;
}
