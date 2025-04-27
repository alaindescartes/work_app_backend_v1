import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('residents', (table) => {
    table.renameColumn('public_url', 'public_id');
    table.renameColumn('primary-diagnosis', 'primaryDiagnosis');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('residents', (table) => {
    table.renameColumn('public_id', 'public_url');
    table.renameColumn('primaryDiagnosis', 'primary-diagnosis');
  });
}
