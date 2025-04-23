import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('group_homes', (table) => {
    table.string('cloudinary_public_id').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('group_homes', (table) => {
    table.dropColumn('image_url');
    table.dropColumn('cloudinary_public_id');
  });
}
