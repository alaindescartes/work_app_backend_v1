import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('tasks', (table) => {
    table
      .integer('completedBy')
      .unsigned()
      .references('staffId')
      .inTable('staff')
      .nullable()
      .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('tasks', (table) => {
    table.dropColumn('completedBy');
  });
}
