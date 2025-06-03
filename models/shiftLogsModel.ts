import { Knex } from 'knex';
import { ShiftLogFetch, ShiftLogInsert } from './interfaces/shiftLog.interface.js';

/**
 * Insert a new shift‑log entry and return the fully‑hydrated row.
 *
 * Steps:
 *  1. Insert the raw data into **shift_logs**, capturing the generated ID.
 *  2. Re‑query the same row joined with **staff** to include the author's
 *     first/last names and convert all timestamps to America/Edmonton.
 *
 * @param knex – pre‑configured Knex instance.
 * @param data – validated payload from the controller (ShiftLogInsert).
 * @returns    ShiftLogFetch  — the newly created log with staff names.
 */
export async function addLogModel(knex: Knex, data: ShiftLogInsert): Promise<ShiftLogFetch> {
  // Insert the row and grab its generated id
  const [inserted] = await knex('shift_logs')
    .insert({
      home_id: data.home_id,
      staff_id: data.staff_id,
      resident_id: data.resident_id ?? null,
      shift_start: data.shift_start,
      shift_end: data.shift_end,
      is_critical: data.is_critical ?? false,
      note: data.note,
    })
    .returning<{ id: number }[]>('id');

  // Fetch the row again and join staff to get author names
  const [row] = await knex('shift_logs as l')
    .leftJoin('staff as s', 's.staffId', 'l.staff_id')
    .where('l.id', inserted.id)
    .select<ShiftLogFetch[]>([
      'l.id',
      'l.home_id',
      'l.staff_id',
      's.firstName as staffFirstName',
      's.lastName as staffLastName',
      'l.resident_id',
      knex.raw("l.shift_start AT TIME ZONE 'America/Edmonton' as shift_start"),
      knex.raw("l.shift_end   AT TIME ZONE 'America/Edmonton' as shift_end"),
      knex.raw("l.created_at AT TIME ZONE 'America/Edmonton' as created_at"),
      'l.is_critical',
      'l.note',
    ]);

  return row;
}

/**
 * Fetch all shift‑log notes for a given home (and optional calendar date).
 *
 * @param knex     – configured Knex instance
 * @param homeId   – FK → group_homes.id
 * @param isoDate  – optional "YYYY‑MM‑DD" string. If provided, only logs whose
 *                   shift_start falls on that day (Edmonton time) are returned.
 */
export async function getLogsModel(
  knex: Knex,
  homeId: number,
  isoDate?: string
): Promise<ShiftLogFetch[]> {
  // If isoDate not supplied, default to today (YYYY-MM-DD) in America/Edmonton
  if (!isoDate) {
    isoDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Edmonton' }).slice(0, 10);
  }

  const query = knex('shift_logs as l')
    .leftJoin('staff as s', 's.staffId', 'l.staff_id')
    .where('l.home_id', homeId)
    .orderBy('l.created_at', 'desc')
    .select<ShiftLogFetch[]>([
      'l.id',
      'l.home_id',
      'l.staff_id',
      's.firstName as staffFirstName',
      's.lastName as staffLastName',
      'l.resident_id',
      knex.raw("l.shift_start AT TIME ZONE 'America/Edmonton' as shift_start"),
      knex.raw("l.shift_end   AT TIME ZONE 'America/Edmonton' as shift_end"),
      knex.raw("l.created_at AT TIME ZONE 'America/Edmonton' as created_at"),
      'l.is_critical',
      'l.note',
    ]);

  // filter logs so that their shift_start calendar day matches isoDate in Edmonton zone
  query.andWhereRaw("to_char(l.shift_start AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD') = ?", [
    isoDate,
  ]);

  return await query;
}

/**
 * Fetch a single shift‑log entry by its primary key.
 *
 * @param knex – configured Knex instance
 * @param id   – primary key of the log row
 * @returns    ShiftLogFetch object or throws if not found
 */
export async function getLogByIdModel(knex: Knex, id: number): Promise<ShiftLogFetch> {
  const row = await knex('shift_logs as l')
    .leftJoin('staff as s', 's.staffId', 'l.staff_id')
    .where('l.id', id)
    .select<ShiftLogFetch[]>([
      'l.id',
      'l.home_id',
      'l.staff_id',
      's.firstName as staffFirstName',
      's.lastName as staffLastName',
      'l.resident_id',
      knex.raw("l.shift_start AT TIME ZONE 'America/Edmonton' as shift_start"),
      knex.raw("l.shift_end   AT TIME ZONE 'America/Edmonton' as shift_end"),
      knex.raw("l.created_at AT TIME ZONE 'America/Edmonton' as created_at"),
      'l.is_critical',
      'l.note',
    ])
    .first();

  if (!row) {
    throw new Error(`Shift log #${id} not found`);
  }

  return row;
}
