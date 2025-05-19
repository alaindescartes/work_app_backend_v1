import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1) add FK column pointing back to the template task
  await knex.schema.alterTable('completedTasks', (table) => {
    table
      .integer('taskId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('tasks')
      .onDelete('CASCADE')
      .index();
  });

  // 2) add a computed date column to support per‑day uniqueness
  await knex.schema.alterTable('completedTasks', (table) => {
    table.date('completedDate').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
  });

  // 3) now we can enforce "one per template per day"
  await knex.schema.raw(`
    CREATE UNIQUE INDEX completed_unique_daily
    ON "completedTasks" ("taskId", "completedDate");
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS completed_unique_daily;');
  await knex.schema.alterTable('completedTasks', (table) => {
    table.dropColumn('completedDate');
    table.dropColumn('taskId');
  });
}
