import { Knex } from 'knex';
import {
  IncidentReportFetch,
  IncidentReportInsert,
} from './interfaces/incidentReport.interface.js';

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

export async function getIncidentReportById(
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
  const [row] = await knex('incident_reports').insert(insertData).returning('*');
  return {
    ...row,
    witnesses,
  };
}
