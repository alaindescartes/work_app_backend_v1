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
 * Fetch logs for a home.  Defaults to *today* (Edmonton) when no date
 * parameters are supplied.  Accepts an optional range:
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function getLogsModel(
  knex: Knex,
  homeId: number,
  from?: string,
  to?: string
): Promise<ShiftLogFetch[]> {
  /* ── default to today's date in Edmonton ── */
  if (!from && !to) {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Edmonton',
    });
    from = to = today; // single-day filter
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

  /* date filters */
  if (from && to) {
    query.andWhereRaw(
      "to_char(l.shift_start AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD') BETWEEN ? AND ?",
      [from.slice(0, 10), to.slice(0, 10)]
    );
  } else if (from) {
    query.andWhereRaw("to_char(l.shift_start AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD') >= ?", [
      from.slice(0, 10),
    ]);
  } else if (to) {
    query.andWhereRaw("to_char(l.shift_start AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD') <= ?", [
      to.slice(0, 10),
    ]);
  }

  return query;
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

/**
 * Update a shift-log row and return the refreshed object with staff names.
 *
 * @param knex    – configured Knex instance
 * @param id      – primary key of the row to update
 * @param changes – partial fields to update (note, is_critical, shift times, resident_id)
 * @returns       ShiftLogFetch
 */
export async function updateLogModel(
  knex: Knex,
  id: number,
  changes: Partial<ShiftLogInsert>
): Promise<ShiftLogFetch> {
  // Prepare payload: remove undefined fields
  const payload: Record<string, unknown> = {};
  if (changes.note !== undefined) payload.note = changes.note.trim();
  if (changes.is_critical !== undefined) payload.is_critical = changes.is_critical;
  if (changes.shift_start) payload.shift_start = changes.shift_start;
  if (changes.shift_end) payload.shift_end = changes.shift_end;
  if (changes.resident_id !== undefined) payload.resident_id = changes.resident_id;

  if (Object.keys(payload).length === 0) {
    throw new Error('No valid fields provided to update');
  }

  await knex('shift_logs').where({ id }).update(payload);

  // Return the freshly updated row
  return await getLogByIdModel(knex, id);
}
