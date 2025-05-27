import type { Knex } from 'knex';

/**
 * Change the primary key `id` from VARCHAR → SERIAL (auto-incrementing integer).
 * ⚠️  Run this only if `incident_reports` is still empty or you don’t care
 *     about preserving the old string IDs. Otherwise you must first copy
 *     the existing data to a temporary table.
 */
export async function up(knex: Knex): Promise<void> {
  // 1. Drop the existing string PK
  await knex.schema.alterTable('incident_reports', (table) => {
    table.dropPrimary();
    table.dropColumn('id');
  });

  // 2. Add a new auto-incrementing integer PK
  await knex.schema.alterTable('incident_reports', (table) => {
    table.increments('id').primary();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Reverse the change: drop the integer PK and restore a string PK
  await knex.schema.alterTable('incident_reports', (table) => {
    table.dropPrimary();
    table.dropColumn('id');
  });

  await knex.schema.alterTable('incident_reports', (table) => {
    table.string('id').primary();
  });
}
