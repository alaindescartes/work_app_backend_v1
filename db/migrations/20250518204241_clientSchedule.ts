import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('schedules', table => {
    table.increments('id').primary();
    table.integer('residentId').notNullable().references('id').inTable('residents');
    table.integer('groupHomeId').notNullable().references('id').inTable('group_homes');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.timestamp('start_time', { useTz: true }).notNullable();
    table.timestamp('end_time', { useTz: true }).notNullable();
    table.boolean('is_recurring').notNullable();
    table.string('rrule').nullable();
    table.enu('schedule_type', ['appointment', 'daily-care', 'outing']).notNullable();
    table.integer('assigned_staff_id').nullable();
    table.enu('status', ['scheduled', 'completed', 'canceled']).notNullable();
    table.timestamp('completed_at');
    table.integer('completed_by');
    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('schedules');
}
