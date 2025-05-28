import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('incident_reports', (t) => {
    t.integer('initialFollowUpId')
      .unsigned()
      .references('id')
      .inTable('incident_follow_ups')
      .onDelete('SET NULL');

    t.dropColumn('followUpDueDate');
    t.dropColumn('followUpCompletedAt');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('incident_reports', (t) => {
    t.date('followUpDueDate');
    t.timestamp('followUpCompletedAt');

    t.dropColumn('initialFollowUpId');
  });
}
