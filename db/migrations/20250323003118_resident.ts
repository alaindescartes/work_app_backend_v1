import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("residents", (table) => {
    table.increments("id").primary();
    table.string("firstName", 50).notNullable();
    table.string("lastName", 50).notNullable();
    table.date("dateOfBirth").notNullable();
    table.string("gender").notNullable();
    table.jsonb("primary-diagnosis").notNullable().defaultTo("[]");
    table.jsonb("allergies").notNullable().defaultTo("[]");
    table.date("admissionDate").notNullable();
    table.string("status").notNullable();
    table.string("image_url").notNullable();
    table.integer("guardianId").unsigned().nullable();
    table.integer("groupHomeId").unsigned().notNullable();
    table
      .enu("marital_status", ["single", "married", "divorced", "widowed"])
      .notNullable();
    table.string("healthcareNumber").notNullable();
    table.string("phoneNumber").nullable;
    table.boolean("isSelfGuardian").notNullable().defaultTo(false);
    table.integer("funderID").unsigned().nullable();

    table
      .foreign("guardianId")
      .references("id")
      .inTable("guardians")
      .onDelete("SET NULL");

    table
      .foreign("groupHomeId")
      .references("id")
      .inTable("group_homes")
      .onDelete("CASCADE");
    table
      .foreign("funderID")
      .references("id")
      .inTable("funders")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("residents");
}
