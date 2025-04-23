import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("staff", (table) => {
    table.increments("staffId").primary();
    table.string("firstName", 50).notNullable();
    table.string("lastName", 50).notNullable();
    table
      .string("role", 20)
      .notNullable()
      .checkIn(["user", "supervisor", "admin"])
      .defaultTo("user");
    table.string("phoneNumber", 20).notNullable();
    table.date("hireDate").notNullable();
    table
      .string("status", 20)
      .checkIn(["active", "inactive"])
      .defaultTo("active");
    table.string("email", 100).unique().notNullable();
    table.string("password", 255).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("staff");
}
