import { Knex } from 'knex';
import { ShiftLogFetch, ShiftLogInsert } from './interfaces/shiftLog.interface.js';
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
