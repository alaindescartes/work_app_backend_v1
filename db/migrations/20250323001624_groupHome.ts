import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("group_homes", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("address").notNullable();
    table.string("phone").notNullable();
    table.string("image_url").nullable();
    table.string("status").notNullable();
    table.integer("managerId").unsigned().nullable();
    table.string("type").nullable();
    table.text("notes").nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());

    table
      .foreign("managerId")
      .references("staffId")
      .inTable("staff")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("group_homes");
}
