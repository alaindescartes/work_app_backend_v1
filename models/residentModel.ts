import knex, { Knex } from 'knex';
import {
  ResidentDbInsert,
  ResidentFetch,
  ResidentInsert,
} from './interfaces/resident.interface.js';

export async function addResident(
  knex: Knex,
  residentData: ResidentDbInsert | ResidentDbInsert[]
): Promise<ResidentFetch | ResidentFetch[]> {
  const rows = await knex('residents').insert(residentData).returning('*');
  return Array.isArray(residentData) ? rows : rows[0];
}

export function findResident(
  knex: Knex,
  firstName: string,
  lastName: string,
  dateOfBirth: string
): Promise<ResidentFetch | undefined> {
  return knex<ResidentFetch>('residents').where({ firstName, lastName, dateOfBirth }).first();
}
