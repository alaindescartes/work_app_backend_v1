import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('residents', (table) => {
    table.string('public_url').nullable();
    table.string('image_url').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('residents', (table) => {
    table.dropColumn('public_url');
    table.dropColumn('image_url');
  });
}
