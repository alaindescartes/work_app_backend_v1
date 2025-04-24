import type { Knex } from 'knex';
import { GroupHomeFetch, GroupHomeInsert } from './interfaces/grouphome.interface.js';

export async function addGroupHome(
  knex: Knex,
  groupHomeData: GroupHomeInsert
): Promise<GroupHomeFetch> {
  const exists = await knex.schema.hasTable('group_homes');
  if (!exists) throw new Error("Table 'group_homes' does not exist.");

  return knex('group_homes')
    .insert(groupHomeData)
    .returning('*')
    .then((rows) => rows[0]);
}
export async function updateGroupHome(
  knex: Knex,
  homeId: string,
  updates: Partial<GroupHomeInsert>
): Promise<GroupHomeFetch> {
  const exists = await knex.schema.hasTable('group_homes');
  if (!exists) throw new Error("Table 'group_homes' does not exist.");

  const rows = await knex('group_homes')
    .where({ id: homeId })
    .update({ ...updates })
    .returning('*');
  return rows[0];
}

export function getGroupHomes(knex: Knex): Promise<GroupHomeFetch[]> {
  return knex('group_homes').select('*');
}

export function getSingleGroupHome(knex: Knex, homeId: string): Promise<GroupHomeFetch> {
  return knex('group_homes').where({ id: homeId }).first();
}

export function deleteHome(knex: Knex, homeId: string): Promise<GroupHomeFetch> {
  return knex('group_homes')
    .where({ id: homeId })
    .del()
    .returning('*')
    .then((rows) => rows[0]);
}
