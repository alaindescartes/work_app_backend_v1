import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('group_homes', (table) => {
    table.string('managerName').nullable();
    table.string('supervisorName').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('group_homes', (table) => {
    table.dropColumn('managerName');
    table.dropColumn('supervisorName');
  });
}
