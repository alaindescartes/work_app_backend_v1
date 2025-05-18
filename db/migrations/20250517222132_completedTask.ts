import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("completedTasks", (table) => {
    table.increments("id").primary();
    table.string("description").notNullable();
    table
      .integer("groupHomeId")
      .unsigned()
      .references("id")
      .inTable("group_homes")
      .notNullable()
      .onDelete("CASCADE")
      .index();
    table
      .integer("residentId")
      .unsigned()
      .references("id")
      .inTable("residents")
      .nullable()
      .onDelete("CASCADE");
    table
      .integer("completedBy")
      .unsigned()
      .references("staffId")
      .inTable("staff")
      .notNullable()
      .onDelete("CASCADE")
      .index();
    table.string("reason").nullable();
    table.enu("status", ["not-done", "completed"]).notNullable();
    table.timestamp("completedAt").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("completedTasks");
}
