import knex, { Knex } from 'knex';
import {
  ResidentDbInsert,
  ResidentDbRow,
  ResidentFetch,
  ResidentInsert,
} from './interfaces/resident.interface.js';

/**
 * Convert a DB value that might be:
 *   • a JSON string (e.g. '["Asthma","Anxiety"]')
 *   • a CSV string   (e.g. 'Asthma,Anxiety')
 *   • a real JS array (when the column is json/jsonb and pg parses it for us)
 *   • null / undefined
 * …into a plain string[].
 */
function parseAsStringArray(value: any): string[] {
  if (value == null) return [];

  // pg-jsonb already gives back a JS array
  if (Array.isArray(value)) return value.map(String);

  if (typeof value === 'string') {
    // Try JSON first
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* not JSON – fall through */
    }
    // Treat as CSV
    return value.split(',').map((s) => s.trim());
  }

  // Fallback for any other unexpected type
  return [];
}

export async function addResident(
  knex: Knex,
  residentData: ResidentDbInsert | ResidentDbInsert[]
): Promise<ResidentFetch | ResidentFetch[]> {
  const rows = await knex('residents').insert(residentData).returning('*');
  return Array.isArray(residentData) ? rows : rows[0];
}

export async function updateResidentById(
  knex: Knex,
  clientId: number,
  updates: Partial<ResidentDbInsert>
): Promise<ResidentFetch> {
  const [raw] = await knex<ResidentDbRow>('residents')
    .where({ id: clientId })
    .update(updates)
    .returning('*');

  return {
    ...raw,
    primaryDiagnosis: parseAsStringArray(raw.primaryDiagnosis),
    allergies: parseAsStringArray(raw.allergies),
  };
}

export async function findResident(
  knex: Knex,
  firstName: string,
  lastName: string,
  dateOfBirth: string
): Promise<ResidentFetch | undefined> {
  return knex<ResidentFetch>('residents').where({ firstName, lastName, dateOfBirth }).first();
}

export async function findResidentById(
  knex: Knex,
  clientId: number
): Promise<ResidentFetch | undefined> {
  return knex<ResidentFetch>('residents').where({ id: clientId }).first();
}

export async function findResidentByHome(
  knex: Knex,
  homeId: number
): Promise<ResidentFetch[] | []> {
  return knex<ResidentFetch>('residents').where({ groupHomeId: homeId }).select('*');
}

export async function deleteClient(
  knex: Knex,
  clientId: number
): Promise<ResidentFetch | undefined> {
  const [deletedResident] = await knex<ResidentFetch>('residents')
    .where({ id: clientId })
    .del()
    .returning('*');

  return deletedResident;
}
