import { Knex } from 'knex';
import {
  CashAllowanceFetch,
  CashAllowanceInsert,
  CashCountFetch,
  CashCountInsert,
  CashTransactionInsert,
} from './finance interface.js';

/**
 * Add a new allowance period **and** create the matching credit row
 * in `cash_transactions`. Returns the inserted allowance row.
 *
 * @param knex – configured Knex instance
 * @param data – payload that satisfies `CashAllowanceInsert`
 * @param systemUserId – staff‑id representing “system” (defaults 0)
 */
export async function addAllowanceModel(
  knex: Knex,
  data: CashAllowanceInsert,
  systemUserId: number = 0
): Promise<CashAllowanceFetch> {
  return await knex.transaction(async trx => {
    /* 1️⃣  create allowance row */
    const [allowance] = await trx<CashAllowanceFetch>('cash_allowances')
      .insert({
        resident_id: data.resident_id,
        period_start: data.period_start,
        period_end: data.period_end ?? null,
        amount_cents: data.amount_cents,
      })
      .returning('*');

    /* 2️⃣  credit transaction so funds appear in ledger */
    const credit: CashTransactionInsert = {
      resident_id: data.resident_id,
      amount_cents: data.amount_cents, // credit
      reason: `Allowance ${data.period_start}`,
      entered_by: systemUserId,
      allowance_id: allowance.id,
    };

    await trx('cash_transactions').insert({
      resident_id: credit.resident_id,
      amount_cents: credit.amount_cents,
      reason: credit.reason,
      entered_by: credit.entered_by,
      allowance_id: credit.allowance_id,
    });

    return allowance;
  });
}

/**
 * Return a full finance summary for one resident.
 *   ─ latestCashCount: newest row in cash_counts (or null)
 *   ─ runningBalance_cents: Σ cash_transactions.amount_cents
 *   ─ openAllowance: current allowance row, if any
 *   ─ transactions: all transactions for the given month (default = this month, MDT)
 *
 * @param knex        – configured Knex instance
 * @param residentId  – PK of the resident
 * @param monthToken  – optional "YYYY-MM" string; default is current month
 */
export async function getResidentFinanceSummary(
  knex: Knex,
  residentId: number,
  monthToken: string = new Date().toISOString().slice(0, 7) // "YYYY-MM"
) {
  /* ---------- resident basic info ----------------------------------- */
  const resident = await knex('residents')
    .where({ id: residentId })
    .first('id', 'firstName', 'lastName', 'groupHomeId');

  if (!resident) throw new Error('Resident not found');

  /* ---------- latest cash‑count ------------------------------------- */
  const latestCashCount = await knex('cash_counts as c')
    .leftJoin('staff as s', 's.staffId', 'c.staff_id')
    .where('c.resident_id', residentId)
    .orderBy('c.counted_at', 'desc')
    .first(
      'c.id',
      'c.balance_cents',
      knex.raw(`c.counted_at AT TIME ZONE 'America/Edmonton' as counted_at`),
      'c.staff_id',
      's.firstName as staffFirstName',
      's.lastName  as staffLastName',
      'c.is_mismatch',
      'c.diff_cents'
    );

  /* ---------- running balance --------------------------------------- */
  const sumRow = await knex('cash_transactions')
    .where({ resident_id: residentId })
    .sum<{ running: string | null }>('amount_cents as running')
    .first();

  const runningBalance_cents = Number(sumRow?.running) || 0;

  /* ---------- open allowance (if any) -------------------------------- */
  const openAllowance = await findOpenAllowance(knex, residentId);

  /* ---------- transactions for monthToken --------------------------- */
  const transactions = await knex('cash_transactions as t')
    .leftJoin('staff as s', 's.staffId', 't.entered_by')
    .where('t.resident_id', residentId)
    .andWhereRaw("to_char(t.created_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM') = ?", [
      monthToken,
    ])
    .orderBy('t.created_at', 'desc')
    .select(
      't.id',
      't.amount_cents',
      't.reason',
      't.entered_by',
      's.firstName as staffFirstName',
      's.lastName  as staffLastName',
      knex.raw(`t.created_at AT TIME ZONE 'America/Edmonton' as created_at`)
    );

  return {
    resident,
    latestCashCount: latestCashCount ?? null,
    runningBalance_cents,
    openAllowance,
    transactions,
  };
}
/**
 * Record a **withdrawal**, **deposit**, or **correction** in the ledger.
 *
 * ‑ `amount_cents` > 0  → credit (cash added)
 * ‑ `amount_cents` < 0  → debit  (cash taken)
 * If `allowance_id` is omitted the row is still valid; you can attach it later.
 *
 * Returns the row exactly as stored in the DB (including generated id / timestamp).
 */
export async function cashTransactionModel(
  knex: Knex,
  data: CashTransactionInsert
): Promise<CashTransactionInsert> {
  if (data.allowance_id == null) {
    throw new Error('cashTransactionModel: allowance_id is required but was null/undefined');
  }
  const [tx] = await knex<CashTransactionInsert>('cash_transactions')
    .insert({
      resident_id: data.resident_id,
      amount_cents: data.amount_cents,
      reason: data.reason ?? null,
      entered_by: data.entered_by,
      allowance_id: data.allowance_id,
    })
    .returning('*');
  return tx;
}

export async function findOpenAllowance(knex: Knex, residentId: number) {
  const today = knex.fn.now();
  return knex('cash_allowances')
    .where({ resident_id: residentId })
    .andWhere('period_start', '<=', today)
    .andWhere(builder => builder.whereNull('period_end').orWhere('period_end', '>=', today))
    .orderBy('period_start', 'desc')
    .first();
}

export async function addCashCountModel(
  knex: Knex,
  data: CashCountInsert
): Promise<CashCountFetch> {
  return await knex.transaction(async trx => {
    // running balance (Σ all transactions up to now)
    const balanceRow = await trx('cash_transactions')
      .where({ resident_id: data.resident_id })
      .sum<{ balance: string | null }>('amount_cents as balance')
      .first();

    const runningBalance = Number(balanceRow?.balance) || 0;
    const diffCents = data.balance_cents - runningBalance;

    const [row] = await trx('cash_counts')
      .insert({
        ...data,
        diff_cents: diffCents,
        is_mismatch: diffCents !== 0,
      })
      .returning('*');

    return row;
  });
}

/**
 * Return an array of residents (id + name) and their most-recent cash count.
 * ─ homeId             – FK to group_homes.id
 * ─ latestOnly = true  – set to false if you want *all* counts per resident
 *
 * Result shape:
 * [
 *   {
 *     resident_id: 9,
 *     first_name: 'Joe',
 *     last_name:  'Philips',
 *     latest_count: { … CashCountFetch … } | null
 *   },
 *   …
 * ]
 */
/**
 * Return **all** cash‑count rows for residents in a given group‑home,
 * limited to the current (or supplied) calendar month.
 *
 * Each row is *flattened* and already contains:
 *  ─ resident_id, firstName, lastName
 *  ─ balance_cents, diff_cents, is_mismatch, counted_at
 *  ─ staffFirstName, staffLastName
 *
 * @param knex       – configured Knex instance
 * @param homeId     – FK to group_homes.id
 * @param monthToken – optional "YYYY-MM" filter (defaults to this month)
 */
export async function getHomeCashCounts(
  knex: Knex,
  homeId: number,
  monthToken: string = new Date().toISOString().slice(0, 7) // "YYYY-MM"
) {
  return knex('cash_counts as c')
    .join('residents as r', 'r.id', 'c.resident_id')
    .leftJoin('staff as s', 's.staffId', 'c.staff_id')
    .where('r.groupHomeId', homeId)
    .andWhereRaw("to_char(c.counted_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM') = ?", [
      monthToken,
    ])
    .orderBy([
      { column: 'r.lastName', order: 'asc' },
      { column: 'c.counted_at', order: 'desc' },
    ])
    .select(
      'c.id',
      'c.resident_id',
      'r.firstName',
      'r.lastName',
      'c.balance_cents',
      'c.diff_cents',
      'c.is_mismatch',
      knex.raw(`c.counted_at AT TIME ZONE 'America/Edmonton' as counted_at`),
      's.firstName as staffFirstName',
      's.lastName  as staffLastName',
      'c.staff_id'
    );
}
