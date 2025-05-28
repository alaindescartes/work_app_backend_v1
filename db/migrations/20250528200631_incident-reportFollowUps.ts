import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('incident_follow_ups', (t) => {
    t.increments('id').primary();
    t.integer('incidentId')
      .notNullable()
      .references('id')
      .inTable('incident_reports')
      .onDelete('CASCADE');

    t.text('title').notNullable();
    t.text('details');
    t.date('dueDate');
    t.timestamp('completedAt');
    t.enum('status', ['Open', 'InProgress', 'Closed']).defaultTo('Open');
    t.integer('assignedToStaffId').references('staffId').inTable('staff');

    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('incident_follow_ups');
}
