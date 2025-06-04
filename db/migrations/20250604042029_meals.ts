import type { Knex } from 'knex';

const MEAL_ENUM = 'meal_type_enum';

export async function up(knex: Knex): Promise<void> {
  // 1) Create PostgreSQL enum for meal types
  await knex.raw(`CREATE TYPE ${MEAL_ENUM} AS ENUM ('breakfast', 'lunch', 'dinner', 'snack')`);

  // 2) Create meals table
  await knex.schema.createTable('meals', table => {
    table.increments('id').primary();
    table.date('meal_date').notNullable(); // YYYY‑MM‑DD
    table.specificType('type', MEAL_ENUM).notNullable();
    table
      .integer('staff_id')
      .notNullable()
      .references('staffId')
      .inTable('staff')
      .onDelete('SET NULL'); // preserve meal record if staff deleted

    table.text('description').nullable(); // what was served
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // optional composite index for quick lookup by date/type
  await knex.schema.alterTable('meals', table => {
    table.unique(['meal_date', 'type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('meals');
  await knex.raw(`DROP TYPE IF EXISTS ${MEAL_ENUM}`);
}
