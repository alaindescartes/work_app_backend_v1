import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import { ShiftLogFetch, ShiftLogInsert } from '../models/interfaces/shiftLog.interface.js';
import {
  addLogModel,
  getLogByIdModel,
  getLogsModel,
  updateLogModel,
} from '../models/shiftLogsModel.js';

export async function getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { homeId } = req.params;

  /* validate homeId */
  const id = Number(homeId);
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('homeId must be a positive number', 400));
  }

  /* parse optional range */
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (from && !dateRegex.test(from)) {
    return next(new AppError('from must be YYYY-MM-DD', 400));
  }
  if (to && !dateRegex.test(to)) {
    return next(new AppError('to must be YYYY-MM-DD', 400));
  }

  try {
    const logs = await getLogsModel(req.app.get('db'), id, from, to);
    res.status(200).json({ data: logs });
  } catch (err: any) {
    next(new AppError(err.message || 'could not get logs', 500));
  }
}

export async function getLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { logId } = req.params;
  const id = Number(logId);
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('homeId must be a positive number', 400));
  }
  try {
    const log = await getLogByIdModel(req.app.get('db'), id);
    if (!log) {
      return next(new AppError(`could not get log with ${id}`, 400));
    }
    res.status(200).json({ log: log });
  } catch (err: any) {
    next(new AppError(err.message || 'could not get log', 500));
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

export async function updateLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { logId } = req.params;
  const id = Number(logId);
  const currentStaffId = req.session.staff?.staffId;

  /* ───────────── validate id ───────────── */
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('logId must be a positive number', 400));
  }

  const updates = req.body as Partial<ShiftLogInsert>;
  if (!updates || typeof updates !== 'object') {
    return next(new AppError('provide a valid updates object', 400));
  }

  /* ───────────── basic field checks ───────────── */
  if (updates.note !== undefined && (!updates.note || !updates.note.trim())) {
    return next(new AppError('note must be a non-empty string', 400));
  }

  if (updates.shift_start && Number.isNaN(new Date(updates.shift_start).valueOf())) {
    return next(new AppError('shift_start must be a valid ISO timestamp', 400));
  }
  if (updates.shift_end && Number.isNaN(new Date(updates.shift_end).valueOf())) {
    return next(new AppError('shift_end must be a valid ISO timestamp', 400));
  }
  if (
    updates.shift_start &&
    updates.shift_end &&
    new Date(updates.shift_end) <= new Date(updates.shift_start)
  ) {
    return next(new AppError('shift_end must be after shift_start', 400));
  }

  try {
    /* ensure the row exists before updating */
    const existing = await getLogByIdModel(req.app.get('db'), id);

    /* ───────────── ownership check ───────────── */
    if (existing.staff_id !== currentStaffId) {
      return next(new AppError('You may edit only your own shift logs', 403));
    }

    const updated = await updateLogModel(req.app.get('db'), id, updates);
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    next(new AppError(err.message || 'could not update log', 500));
  }
}
