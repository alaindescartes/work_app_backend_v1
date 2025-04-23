import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("funders", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("type").notNullable();
    table.string("contactName").notNullable();
    table.string("contactEmail").notNullable();
    table.string("contactPhone").notNullable();
    table.string("address").notNullable();
    table.text("notes").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("funders");
}
