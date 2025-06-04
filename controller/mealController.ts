import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { addMealModel, getMealsModel, MealInsert } from '../models/MealModel.js';

/* ------------------------------------------------------------------ */
/* GET /api/meals/:homeId?from=YYYY-MM-DD&to=YYYY-MM-DD                */
/* ------------------------------------------------------------------ */
export async function getMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = Number(req.params.homeId);
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('homeId must be a positive number', 400));
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;

  if (from && !dateRe.test(from)) return next(new AppError('from must be YYYY-MM-DD', 400));
  if (to && !dateRe.test(to)) return next(new AppError('to must be YYYY-MM-DD', 400));

  try {
    /* model will apply 7-day default when both params are undefined */
    const meals = await getMealsModel(req.app.get('db'), id, from, to);
    res.status(200).json({ success: true, data: meals });
  } catch (err: any) {
    next(new AppError(err.message || 'could not get meals', 500));
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/meals (body: MealInsert)                                  */
/* ------------------------------------------------------------------ */
export async function addMeal(req: Request, res: Response, next: NextFunction): Promise<void> {
  const body = req.body as Partial<MealInsert>;
  const err400 = (msg: string) => next(new AppError(msg, 400));

  /* ---- basic presence checks ---- */
  if (!body.home_id || !body.staff_id) return err400('home_id and staff_id are required');
  if (!body.meal_date || !body.type) return err400('meal_date and type are required');
  if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(body.type))
    return err400('type must be one of breakfast, lunch, dinner, snack');

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(body.meal_date)) return err400('meal_date must be YYYY-MM-DD');

  const payload: MealInsert = {
    home_id: body.home_id,
    staff_id: body.staff_id,
    meal_date: body.meal_date,
    type: body.type as MealInsert['type'],
    description: body.description ?? null,
  };

  try {
    const meal = await addMealModel(req.app.get('db'), payload);
    res.status(201).json({ success: true, data: meal });
  } catch (err: any) {
    next(new AppError(err.message || 'could not add meal', 500));
  }
}
