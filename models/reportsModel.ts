import { Knex } from 'knex';
import {
  IncidentReportFetch,
  IncidentReportInsert,
} from './interfaces/incidentReport.interface.js';

// ------------------Incident Reports Section---------------------------------------
export async function getIncidentReports(knex: Knex): Promise<IncidentReportFetch[]> {
  const rows = await knex('incident_reports').select('*').orderBy('id', 'desc');
  return rows.map((r: any) => ({
    ...r,
    witnesses: r.witnessesJson ? JSON.parse(r.witnessesJson) : [],
  }));
}
export async function getIncidentReportById(
  knex: Knex,
  id: number
): Promise<IncidentReportFetch | undefined> {
  const row = await knex('incident_reports').where({ id }).first();
  if (!row) return undefined;
  return {
    ...row,
    witnesses: row.witnessesJson ? JSON.parse(row.witnessesJson) : [],
  };
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
