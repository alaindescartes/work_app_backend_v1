import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import { Schedule, ScheduleInsert } from '../models/interfaces/schedule.js';
import {
  addScheduleModel,
  changeScheduleStatusModel,
  getScheduleByHomeModel,
} from '../models/scheduleModels.js';

/**
 * Add one or multiple schedules to the database.
 *
 * @route POST /schedules
 * @param req - Express Request object containing a single `Schedule` or an array of `Schedule`
 *              objects in `req.body`.
 * @param res - Express Response object used to return the newly created schedule records.
 * @param next - Express NextFunction for propagating errors to the global handler.
 *
 * @returns Sends a 200 response with `{ schedules: Schedule | Schedule[] }` when insertion succeeds.
 *
 * @throws 400 - If `req.body` is empty or `addScheduleModel` returns a falsy value.
 * @throws 500 - For unhandled errors thrown during insertion.
 */
export async function addSchedules(req: Request, res: Response, next: NextFunction) {
  const schedules: ScheduleInsert | ScheduleInsert[] = req.body;
  if (!schedules) return next(new AppError('Provide valid tasks', 400));

  try {
    const addedSchedule = await addScheduleModel(schedules, req.app.get('db'));
    if (!addedSchedule) return next(new AppError('could not add Schedule', 400));
    res.status(200).json({ schedules: addedSchedule });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('could not add schedules', err);
    }
    return next(new AppError(err.message || 'Error while adding schedules', 500));
  }
}

/**
 * Get all schedules belonging to a specific group home.
 *
 * @route GET /schedules/home/:homeId
 *
 * @param req - Express Request object; expects a route param `homeId` (stringified number).
 * @param res - Express Response object; on success returns
 *              ```json
 *              { "schedules": Schedule[] }
 *              ```
 * @param next - Express NextFunction used for propagating errors.
 *
 * @returns Sends a 200 response with the list of schedules (can be empty).
 *
 * @throws 400 - If `homeId` is missing or not a valid number.
 * @throws 404 - If no schedules are found for the given home (optional; depends on API contract).
 * @throws 500 - For unhandled server/database errors.
 */
export async function getSchedulesByHome(req: Request, res: Response, next: NextFunction) {
  const { homeId } = req.params;
  if (!homeId) {
    return next(new AppError('Provide valid homeId', 400));
  }
  try {
    const schedules = await getScheduleByHomeModel(Number(homeId), req.app.get('db'));
    if (!schedules) return next(new AppError('Could not get schedules', 400));
    res.status(200).json({ schedules: schedules });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('could not get schedules', err);
    }
    return next(new AppError(err.message || 'Error while fetching schedules', 500));
  }
}

export async function markScheduleAsCompletedOrCancelled(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { staffId, id } = req.params;

  const { status } = req.body;

  if (!id || !staffId) return next(new AppError('Missing id or staffId', 400));
  if (!['completed', 'canceled'].includes(status))
    return next(new AppError('Status must be "completed" or "canceled"', 400));

  try {
    const updated = await changeScheduleStatusModel(
      req.app.get('db'),
      Number(id),
      Number(staffId),
      status as 'completed' | 'canceled'
    );

    if (!updated) return next(new AppError('Schedule not found', 404));

    res.status(200).json({
      message: `Schedule marked ${status}`,
      schedule: updated,
    });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    next(new AppError(err.message || 'Error updating schedule', 500));
  }
}
