import type { Knex } from "knex";
import { StaffBase } from "./interfaces/staff.js";

// Inserting staff data
export type StaffInsert = Omit<
  StaffBase,
  "staffId" | "created_at" | "updated_at"
>;
//fetching staff
export type StaffFetch = Required<StaffBase>;

//function to add staff data
export async function addStaff(
  knex: Knex,
  staffData: StaffInsert
): Promise<StaffFetch> {
  const exists = await knex.schema.hasTable("staff");

  if (!exists) {
    throw new Error("Table 'staff' does not exist.");
  }

  const [newStaff] = await knex("staff").insert(staffData).returning("*");
  return newStaff;
}

//function to delete staff data
interface staffToDelete {
  firstName: string;
  lastName: string;
}
export async function deleteStaff(
  knex: Knex,
  data: staffToDelete
): Promise<staffToDelete> {
  const staffExists = await knex("staff")
    .where({ firstName: data.firstName, lastName: data.lastName })
    .first();

  if (!staffExists) {
    throw new Error("Staff member not found.");
  }

  const [deletedStaff] = await knex("staff")
    .where({ firstName: data.firstName, lastName: data.lastName })
    .del()
    .returning(["firstName", "lastName"]);

  return deletedStaff || null;
}

//function to get staff data
export async function getStaffData(
  knex: Knex,
  email: string
): Promise<StaffFetch> {
  const staff = await knex("staff").where({ email }).first();
  if (!staff) {
    throw new Error("Staff member not found.");
  }
  return staff;
}
