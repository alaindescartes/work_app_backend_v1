import type { Knex } from "knex";
import {
  ResidentFetch,
  ResidentInsert,
} from "../models/interfaces/resident.interface.js";

export function addResident(
  knex: Knex,
  residentData: ResidentInsert
): Promise<ResidentFetch> {
  return knex("residents")
    .insert(residentData)
    .returning("*")
    .then((rows) => rows[0]);
}
