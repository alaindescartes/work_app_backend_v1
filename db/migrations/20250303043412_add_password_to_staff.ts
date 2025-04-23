import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const columnExists = await knex.schema.hasColumn("staff", "password");
  if (columnExists) {
    return;
  }
  return knex.schema.alterTable("staff", (table) => {
    table.string("password", 255).defaultTo("temp_password").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("staff", (table) => {
    table.dropColumn("password");
  });
}
