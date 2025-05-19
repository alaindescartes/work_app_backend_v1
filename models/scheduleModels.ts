import { Knex } from 'knex';
import { Schedule, ScheduleInsert } from './interfaces/schedule.js';

/**
 * Insert one or many schedules into the `schedules` table.
 *
 * @param schedules  A single ScheduleInsert object or an array of them.
 * @param knex       A configured Knex instance.
 * @returns          The inserted row(s) as plain objects.*
 *
 * Notes:
 * - Adds created_at / updated_at timestamps automatically.
 * - Defaults `status` to "scheduled" when missing.
 * - Converts camelCase keys to snake_case to match DB column names.
 */
export async function addScheduleModel(
  schedules: ScheduleInsert | ScheduleInsert[],
  knex: Knex
): Promise<Schedule | Schedule[]> {
  const rows = Array.isArray(schedules) ? schedules : [schedules];

  // Map camelCase TS objects to DB column names + defaults
  const rowsToInsert = rows.map(s => ({
    resident_id: s.residentId,
    group_home_id: s.groupHomeId,
    title: s.title,
    description: s.description,
    start_time: s.start_time,
    end_time: s.end_time,
    is_recurring: s.is_recurring,
    rrule: s.rrule ?? null,
    schedule_type: s.schedule_type,
    assigned_staff_id: s.assigned_staff_id ?? null,
    status: s.status ?? 'scheduled',
    completed_at: s.completed_at ?? null,
    completed_by: s.completed_by ?? null,
    notes: s.notes ?? null,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  }));

  // Insert and return all generated columns (requires Postgres)
  const inserted = await knex('schedules').insert(rowsToInsert).returning('*');

  return Array.isArray(schedules) ? inserted : inserted[0];
}

/**
 * Retrieve all schedules for a specific group home.
 *
 * @param homeId - The `group_home_id` to filter by.
 * @param knex   - A configured Knex instance.
 * @returns      An array of schedules for that home.
 *
 * @throws Error if `homeId` is falsy.
 */
export async function getScheduleByHomeModel(homeId: number, knex: Knex): Promise<Schedule[]> {
  if (!homeId) {
    throw new Error('No homeId provided');
  }

  const rows = await knex<Schedule>('schedules').where({ groupHomeId: homeId }).select('*');

  return rows;
}
