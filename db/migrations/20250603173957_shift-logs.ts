import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('shift_logs', (table) => {
    table.increments('id').primary();

    table
      .integer('home_id')
      .notNullable()
      .references('id')
      .inTable('group_homes')
      .onDelete('CASCADE');

    table
      .integer('staff_id')
      .notNullable()
      .references('staffId')
      .inTable('staff')
      .onDelete('SET NULL');

    table
      .integer('resident_id')
      .nullable()
      .references('id')
      .inTable('residents')
      .onDelete('SET NULL');

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.timestamp('shift_start', { useTz: true }).notNullable();

    table.timestamp('shift_end', { useTz: true }).notNullable();

    table.boolean('is_critical').notNullable().defaultTo(false);

    table.text('note').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('shift_logs');
}
