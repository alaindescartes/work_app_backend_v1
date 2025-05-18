import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('schedules', table => {
    table.index(['residentId']);
    table.index(['groupHomeId']);
    table.index(['start_time']);
    table.index(['status']);
    table.index(['assigned_staff_id']);
    table.index(['residentId', 'start_time']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('schedules', table => {
    table.dropIndex(['residentId']);
    table.dropIndex(['groupHomeId']);
    table.dropIndex(['start_time']);
    table.dropIndex(['status']);
    table.dropIndex(['assigned_staff_id']);
    table.dropIndex(['residentId', 'start_time']);
  });
}
