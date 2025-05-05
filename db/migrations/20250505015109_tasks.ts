import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("tasks", (table) => {
        table.increments("id").primary();
        table.string("description").notNullable();
        table.integer("groupHomeId").unsigned().references("id").inTable("group_homes").notNullable().onDelete("CASCADE");
        table.integer("residentId").unsigned().references("id").inTable("residents").nullable().onDelete("CASCADE");

        table.enu("status", ["pending", "completed"]).notNullable().defaultTo("pending");
        table.timestamp("completedAt").nullable();
        table.timestamps(true, true); 
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("tasks");
}
