import { Knex } from 'knex';

/* ------------------------------------------------------------------ */
/* Interfaces                                                          */
/* ------------------------------------------------------------------ */

export interface MealInsert {
  home_id: number;
  staff_id: number;
  meal_date: string; // YYYY-MM-DD in Edmonton TZ
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description?: string | null;
}

export interface MealFetch {
  id: number;
  home_id: number;
  staff_id: number;
  staffFirstName: string;
  staffLastName: string;
  meal_date: string; // YYYY-MM-DD (Edmonton)
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string | null;
  created_at: string; // ISO string (Edmonton)
}

/* ------------------------------------------------------------------ */
/* Add a meal                                                          */
/* ------------------------------------------------------------------ */
export async function addMealModel(knex: Knex, meal: MealInsert): Promise<MealFetch> {
  const [inserted] = await knex('meals')
    .insert({
      meal_date: meal.meal_date,
      type: meal.type,
      staff_id: meal.staff_id,
      groupHome_id: meal.home_id,
      description: meal.description ?? null,
    })
    .returning<{ id: number }[]>('id');

  const row = await knex('meals as m')
    .leftJoin('staff as s', 's.staffId', 'm.staff_id')
    .where('m.id', inserted.id)
    .select<MealFetch[]>([
      'm.id',
      'm.groupHome_id as home_id',
      'm.staff_id',
      's.firstName as staffFirstName',
      's.lastName  as staffLastName',
      knex.raw('m.meal_date::text as meal_date'),
      'm.type',
      'm.description',
      knex.raw(
        "to_char(m.created_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD\"T\"HH24:MI:SSOF') as created_at"
      ),
    ])
    .first();

  if (!row) throw new Error('Meal insert failed');
  return row;
}

/* ------------------------------------------------------------------ */
/* Get meals for a home (optionally by date range)                     */
/* ------------------------------------------------------------------ */
export async function getMealsModel(
  knex: Knex,
  homeId: number,
  from?: string,
  to?: string
): Promise<MealFetch[]> {
  /* ── Default window: last 7 days (Edmonton) ───────────────────────── */
  if (!from && !to) {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Edmonton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()); // YYYY-MM-DD

    const past = new Date(today);
    past.setDate(past.getDate() - 7);

    const fromDefault = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Edmonton',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(past);

    from = fromDefault;
    to = today; // inclusive range
  }

  const q = knex('meals as m')
    .leftJoin('staff as s', 's.staffId', 'm.staff_id')
    .where('m.groupHome_id', homeId)
    .orderBy(['m.meal_date', 'm.type'])
    .select<MealFetch[]>([
      'm.id',
      'm.groupHome_id as home_id',
      'm.staff_id',
      's.firstName as staffFirstName',
      's.lastName  as staffLastName',
      knex.raw('m.meal_date::text as meal_date'),
      'm.type',
      'm.description',
      knex.raw(
        "to_char(m.created_at AT TIME ZONE 'America/Edmonton', 'YYYY-MM-DD\"T\"HH24:MI:SSOF') as created_at"
      ),
    ]);

  /* date filtering */
  if (from && to) {
    q.andWhereBetween('m.meal_date', [from, to]);
  } else if (from) {
    q.andWhere('m.meal_date', '>=', from);
  } else if (to) {
    q.andWhere('m.meal_date', '<=', to);
  }

  return await q;
}
