import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import { ShiftLogFetch, ShiftLogInsert } from '../models/interfaces/shiftLog.interface.js';
import { addLogModel, getLogsModel } from '../models/shiftLogsModel.js';

export async function getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { homeId } = req.params;
  const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;

  /* ───────────── validate homeId ───────────── */
  const id = Number(homeId);
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('homeId must be a positive number', 400));
  }

  /* optional date (YYYY-MM-DD) */
  let date: string | undefined;
  if (dateParam) {
    // basic YYYY-MM-DD sanity check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return next(new AppError('date must be in YYYY-MM-DD format', 400));
    }
    date = dateParam;
  }

  try {
    const logs = await getLogsModel(req.app.get('db'), id, date);
    res.status(200).json({ data: logs });
  } catch (err: any) {
    next(new AppError(err.message || 'could not get logs', 500));
  }
}

export async function addLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  const log: ShiftLogInsert = req.body;

  /* ───────────── basic presence checks ───────────── */
  if (!log) {
    return next(new AppError('provide a valid full log', 400));
  }

  if (!log.home_id || !log.staff_id) {
    return next(new AppError('provide a valid home_id and staff_id', 400));
  }

  if (!log.shift_start || !log.shift_end) {
    return next(new AppError('shift_start and shift_end timestamps are required', 400));
  }

  if (!log.note || typeof log.note !== 'string' || !log.note.trim()) {
    return next(new AppError('note must be a non-empty string', 400));
  }

  /* ───────────── type / range checks ───────────── */
  if (Number(log.home_id) <= 0 || Number(log.staff_id) <= 0) {
    return next(new AppError('home_id and staff_id must be positive numbers', 400));
  }

  const start = new Date(log.shift_start);
  const end = new Date(log.shift_end);

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return next(new AppError('shift_start and shift_end must be valid ISO timestamps', 400));
  }

  if (end <= start) {
    return next(new AppError('shift_end must be after shift_start', 400));
  }

  /* ───────────── perform insert ───────────── */
  try {
    const addedLog = await addLogModel(req.app.get('db'), {
      ...log,
      shift_start: start.toISOString(),
      shift_end: end.toISOString(),
      note: log.note.trim(),
      is_critical: log.is_critical ?? false,
    });

    if (!addedLog) {
      return next(new AppError('could not add shift log', 400));
    }

    res.status(201).json({ success: true, data: addedLog });
  } catch (err: any) {
    next(new AppError(err.message || 'could not add shift log', 500));
  }
}
