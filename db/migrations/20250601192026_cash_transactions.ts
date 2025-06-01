import type { Knex } from 'knex';

/**
 * Full money‑tracking schema
 *
 *  • cash_allowances   – allowance issued per period (creates a credit transaction)
 *  • cash_transactions – every withdrawal / deposit / allowance credit
 *  • cash_counts       – staff reconciliations (cash‑on‑hand counts)
 *
 * Foreign‑keys assume existing `residents` and `staff` tables.
 */
export async function up(knex: Knex): Promise<void> {
  /* ------------------------------------------------------------------ */
  /* 1. cash_transactions –– create first so other tables can reference */
  /* ------------------------------------------------------------------ */
  const txExists = await knex.schema.hasTable('cash_transactions');
  if (!txExists) {
    await knex.schema.createTable('cash_transactions', t => {
      t.increments('id').primary();

      t.integer('resident_id')
        .notNullable()
        .references('id')
        .inTable('residents')
        .onDelete('CASCADE');

      t.integer('amount_cents').notNullable(); // signed: +credit, –debit
      t.string('reason').nullable();

      t.integer('entered_by') // staff FK
        .notNullable()
        .references('staffId')
        .inTable('staff');

      t.timestamp('created_at').defaultTo(knex.fn.now());

      // will be added below once cash_allowances exists
    });

    await knex.schema.raw(
      `CREATE INDEX cash_tx_resident_idx ON cash_transactions(resident_id, created_at)`
    );
  }

  /* ------------------------------------------------------------------ */
  /* 2. cash_allowances – one row per allowance period                  */
  /* ------------------------------------------------------------------ */
  const allowanceExists = await knex.schema.hasTable('cash_allowances');
  if (!allowanceExists) {
    await knex.schema.createTable('cash_allowances', t => {
      t.increments('id').primary();

      t.integer('resident_id')
        .notNullable()
        .references('id')
        .inTable('residents')
        .onDelete('CASCADE');

      t.date('period_start').notNullable();
      t.date('period_end'); // nullable (open period)

      t.integer('amount_cents').notNullable(); // e.g. 100000 → $1,000

      t.timestamp('created_at').defaultTo(knex.fn.now());

      t.unique(['resident_id', 'period_start']);
    });

    await knex.schema.raw(
      `CREATE INDEX allowance_resident_period_idx
       ON cash_allowances(resident_id, period_start)`
    );
  }

  /* ------------------------------------------------------------------ */
  /* 2a. add allowance_id FK to cash_transactions (if missing)          */
  /* ------------------------------------------------------------------ */
  const hasAllowanceId = await knex.schema.hasColumn('cash_transactions', 'allowance_id');
  if (!hasAllowanceId) {
    await knex.schema.alterTable('cash_transactions', t => {
      t.integer('allowance_id').references('id').inTable('cash_allowances').onDelete('SET NULL');
    });
    await knex.schema.raw(`CREATE INDEX cash_tx_allowance_idx ON cash_transactions(allowance_id)`);
  }

  /* ------------------------------------------------------------------ */
  /* 3. cash_counts – staff reconciliation events                       */
  /* ------------------------------------------------------------------ */
  const countsExists = await knex.schema.hasTable('cash_counts');
  if (!countsExists) {
    await knex.schema.createTable('cash_counts', t => {
      t.increments('id').primary();

      t.integer('resident_id')
        .notNullable()
        .references('id')
        .inTable('residents')
        .onDelete('CASCADE');

      t.integer('balance_cents').notNullable();
      t.integer('diff_cents').nullable(); // balance - running ledger
      t.boolean('is_mismatch').defaultTo(false);

      t.integer('staff_id').notNullable().references('staffId').inTable('staff');

      t.timestamp('counted_at').defaultTo(knex.fn.now());
    });

    await knex.schema.raw(
      `CREATE INDEX cash_counts_resident_idx
       ON cash_counts(resident_id, counted_at)`
    );
  }
}

/* ---------------------------------------------------------------------- */
export async function down(knex: Knex): Promise<void> {
  // order matters due to FK
  await knex.schema.dropTableIfExists('cash_counts');

  const hasAllowanceId = await knex.schema.hasColumn('cash_transactions', 'allowance_id');
  if (hasAllowanceId) {
    await knex.schema.alterTable('cash_transactions', t => {
      t.dropColumn('allowance_id');
    });
  }

  await knex.schema.dropTableIfExists('cash_allowances');
  await knex.schema.dropTableIfExists('cash_transactions');
}
