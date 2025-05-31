import { Knex } from 'knex';
import {
  IncidentReportFetch,
  IncidentReportInsert,
  IncidentReportSupervisorUpdate,
} from './interfaces/incidentReport.interface.js';
import {
  IncidentFollowUpFetch,
  IncidentFollowUpInsert,
} from './interfaces/incident-followUps.interface.js';

// ------------------Incident Reports Section---------------------------------------
export async function getIncidentReportsModel(
  knex: Knex,
  groupHomeId: number
): Promise<IncidentReportFetch[]> {
  const rows = await knex('incident_reports')
    .select('*')
    .where({ groupHomeId })
    .orderBy('id', 'desc');

  return rows.map((r: any) => {
    const raw = r.witnessesJson ?? [];
    const witnesses =
      typeof raw === 'string' ? (JSON.parse(raw) as IncidentReportFetch['witnesses']) : raw;

    return { ...r, witnesses };
  });
}

export async function getIncidentReportByIdModel(
  knex: Knex,
  id: number
): Promise<IncidentReportFetch | undefined> {
  const row = await knex('incident_reports').where({ id }).first();
  if (!row) return undefined;

  const raw = row.witnessesJson ?? [];
  const witnesses =
    typeof raw === 'string' ? (JSON.parse(raw) as IncidentReportFetch['witnesses']) : raw;

  return { ...row, witnesses };
}
export async function addIncidentReport(
  knex: Knex,
  incidentReport: IncidentReportInsert
): Promise<IncidentReportFetch> {
  // Strip out `witnesses` and convert to JSON column.
  const { witnesses = [], ...rest } = incidentReport as any;
  const insertData = { ...rest, witnessesJson: JSON.stringify(witnesses) };
  // Convert blank date/time strings ("") to null so Postgres accepts them
  const dateFields = [
    'incidentDateTime',
    'medicationScheduledDateTime',
    'pharmacistConversationTime',
    'notificationTime',
    'reportDate',
  ] as const;

  for (const f of dateFields) {
    if ((insertData as any)[f] === '') {
      (insertData as any)[f] = null;
    }
  }

  // ---------- optional initial follow‑up on insert ----------
  let initialFollowUpId: number | null = null;
  if (incidentReport.followUpRequired) {
    const [fu] = await knex('incident_follow_ups')
      .insert({
        incidentId: null, // placeholder will patch later
        title: 'Initial follow‑up — define corrective action',
        status: 'Open',
        dueDate: knex.raw("now() + interval '3 days'"), // due in 3 days
      })
      .returning('id');
    initialFollowUpId = fu.id;
    (insertData as any).initialFollowUpId = initialFollowUpId;
  }

  const [row] = await knex('incident_reports').insert(insertData).returning('*');

  // if we created a follow‑up before the incident existed, patch its incidentId now
  if (initialFollowUpId) {
    await knex('incident_follow_ups')
      .where({ id: initialFollowUpId })
      .update({ incidentId: row.id });
  }

  return {
    ...row,
    witnesses,
  };
}
export async function updateReportModel(
  knex: Knex,
  id: number,
  updates: IncidentReportSupervisorUpdate
): Promise<IncidentReportFetch | undefined> {
  //Strip out undefined keys (PATCH semantics)
  const cleanUpdates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined) cleanUpdates[k] = v;
  }

  // ---------- create initial follow‑up if needed ----------
  // We need to know the current state before the update
  const currentRow = await getIncidentReportByIdModel(knex, id);
  if (currentRow && currentRow.followUpRequired === false && updates.followUpRequired === true) {
    // 1) Insert a follow‑up task
    const [fu] = await knex('incident_follow_ups')
      .insert({
        incidentId: id,
        title: 'Initial follow‑up — define corrective action',
        status: 'Open',
        dueDate: knex.raw("now() + interval '3 days'"), // due in 3 days
      })
      .returning('id');

    // 2) Store its id in the incident row
    cleanUpdates.initialFollowUpId = fu.id;
  }

  //Nothing to update → return the current row
  if (Object.keys(cleanUpdates).length === 0) {
    return getIncidentReportByIdModel(knex, id);
  }

  //Ensure the updated_at column is refreshed
  (cleanUpdates as any).updated_at = knex.fn.now();

  //Perform the update and get the new row
  const [row] = await knex('incident_reports').where({ id }).update(cleanUpdates).returning('*');

  if (!row) return undefined;

  // Parse witnessesJson exactly like the fetch helpers
  const raw = row.witnessesJson ?? [];
  const witnesses =
    typeof raw === 'string' ? (JSON.parse(raw) as IncidentReportFetch['witnesses']) : raw;

  return { ...row, witnesses };
}

/**
 * Retrieve a single follow‑up task by the primary key.
 * Returns `undefined` if the id does not exist.
 */
export async function getIncidentFollowUpByIdModel(
  knex: Knex,
  id: number
): Promise<IncidentFollowUpFetch | undefined> {
  const row = await knex<IncidentFollowUpFetch>('incident_follow_ups').where({ id }).first();

  return row ?? undefined;
}

/**
 * Retrieve **all** follow‑up tasks belonging to a given group‑home.
 */
export async function getIncidentFollowUpModel(
  knex: Knex,
  homeId: number
): Promise<IncidentFollowUpFetch[]> {
  const rows = await knex<IncidentFollowUpFetch>('incident_follow_ups as f')
    .join('incident_reports as r', 'r.id', 'f.incidentId')
    .where('r.groupHomeId', homeId)
    .select('f.*')
    .orderBy('f.id', 'desc');

  return rows;
}
/**
 * Update an existing follow‑up row.
 * • `data` must contain the primary‑key `id` and any fields to patch.
 * • Returns the fully updated row.
 */
export async function editFollowUpModel(
  knex: Knex,
  data: IncidentFollowUpInsert & { id: number }
): Promise<IncidentFollowUpFetch> {
  const { id, ...rest } = data as any;
  if (!id) {
    throw new Error('editFollowUpModel requires an id property');
  }

  // Strip undefined (PATCH semantics)
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) updates[k] = v;
  }

  // Convert blank dates to null so Postgres accepts them
  const dateFields = ['dueDate', 'completedAt'] as const;
  for (const f of dateFields) {
    if ((updates as any)[f] === '') {
      (updates as any)[f] = null;
    }
  }

  // No changes → return current row
  if (Object.keys(updates).length === 0) {
    const current = await knex<IncidentFollowUpFetch>('incident_follow_ups').where({ id }).first();
    if (!current) throw new Error(`Follow‑up #${id} not found`);
    return current;
  }

  // Touch updated_at
  (updates as any).updated_at = knex.fn.now();

  const [row] = await knex<IncidentFollowUpFetch>('incident_follow_ups')
    .where({ id })
    .update(updates)
    .returning('*');

  if (!row) {
    throw new Error(`Follow‑up #${id} not found`);
  }
  return row;
}
