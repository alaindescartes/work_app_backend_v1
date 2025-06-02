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
export async function getHomeCashCounts(knex: Knex, homeId: number, latestOnly = true) {
  if (!latestOnly) {
    // fallback: return all counts (same as your getAllCashCountsForHome)
    return knex('cash_counts as c')
      .join('residents as r', 'r.id', 'c.resident_id')
      .where('r.groupHomeId', homeId)
      .orderBy(['r.lastName', { column: 'c.counted_at', order: 'desc' }]);
  }

  // 1) sub-query: latest count per resident using DISTINCT ON
  const latestPerResident = knex
    .select(knex.raw('DISTINCT ON (resident_id) *'))
    .from('cash_counts')
    .orderBy([
      'resident_id',
      { column: 'counted_at', order: 'desc' }, // keep newest row
    ])
    .as('lc');

  // 2) join with residents in the home
  return knex('residents as r')
    .leftJoin(latestPerResident, 'lc.resident_id', 'r.id')
    .where('r.groupHomeId', homeId)
    .orderBy('r.lastName', 'asc')
    .select(
      'r.id as resident_id',
      'r.firstName',
      'r.lastName',
      knex.raw('to_jsonb(lc.*) as latest_count')
    );
}
