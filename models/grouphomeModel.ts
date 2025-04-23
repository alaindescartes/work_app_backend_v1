import type { Knex } from "knex";
import {
  GroupHomeFetch,
  GroupHomeInsert,
} from "./interfaces/grouphome.interface.js";

export async function addGroupHome(
  knex: Knex,
  groupHomeData: GroupHomeInsert
): Promise<GroupHomeFetch> {
  const exists = await knex.schema.hasTable("group_homes");
  if (!exists) throw new Error("Table 'group_homes' does not exist.");

  return knex("group_homes")
    .insert(groupHomeData)
    .returning("*")
    .then((rows) => rows[0]);
}

export function getGroupHomes(knex: Knex): Promise<GroupHomeFetch[]> {
  return knex("group_homes").select("*");
}
