import { AppError } from '../utils/appError.js';
import { NextFunction, Request, Response } from 'express';
import {
  CashAllowanceInsert,
  CashCountInsert,
  CashTransactionInsert,
} from '../models/interfaces/finance interface.js';
import {
  addAllowanceModel,
  addCashCountModel,
  cashTransactionModel,
  findOpenAllowance,
  getHomeCashCounts,
  getResidentFinanceSummary,
} from '../models/interfaces/cashModel.js';
import { findResidentById } from '../models/residentModel.js';
import { getIncidentReportByIdModel } from '../models/reportsModel.js';
import { getStaffById } from '../models/staffModel.js';
import { renderReportHtml } from '../utils/renderReportHtml.js';
import { generatePdfDoc } from '../utils/generatePdfDoc.js';
import { exportTransactionsHtml } from '../utils/renderTransactionSummary.js';

export async function getCashCountByHome(req: Request, res: Response, next: NextFunction) {
  const { homeId } = req.params;

  /* ---------- validate param ---------- */
  const id = Number(homeId);
  if (!Number.isFinite(id)) {
    return next(new AppError('homeId must be a number', 400));
  }

  try {
    const counts = await getHomeCashCounts(req.app.get('db'), id);
    res.status(200).json({ counts });
  } catch (err: any) {
    next(new AppError(err.message || 'There was a problem while retrieving cash counts', 500));
  }
}

export async function addCashCount(req: Request, res: Response, next: NextFunction) {
  const payload = req.body as CashCountInsert;

  /* ---------- basic validation ---------- */
  if (!Number.isInteger(payload?.resident_id)) {
    return next(new AppError('resident_id must be provided', 400));
  }
  if (!Number.isInteger(payload.balance_cents)) {
    return next(new AppError('balance_cents must be an integer', 400));
  }
  if (!Number.isInteger(payload.staff_id)) {
    return next(new AppError('staff_id must be provided', 400));
  }

  /* ---------- foreign-key sanity ---------- */
  const resident = await findResidentById(req.app.get('db'), payload.resident_id);
  if (!resident) {
    return next(new AppError('Resident not found', 404));
  }

  try {
    const cashCount = await addCashCountModel(req.app.get('db'), payload);
    res.status(201).json({ cash_count: cashCount });
  } catch (err: any) {
    next(new AppError(err.message || 'Problem occurred while adding cash count', 500));
  }
}

export async function addAllowance(req: Request, res: Response, next: NextFunction) {
  const { supervisorId } = req.params;
  const payload = req.body as CashAllowanceInsert;

  const staffId = Number(supervisorId);
  if (!Number.isFinite(staffId)) {
    return next(new AppError('Supervisor ID must be a number', 400));
  }
  if (!payload) {
    return next(new AppError('Provide a valid allowance payload', 400));
  }

  try {
    const clientExists = await findResidentById(req.app.get('db'), Number(payload.resident_id));
    const isValidAmount = payload.amount_cents > 0;
    if (!clientExists) {
      return next(new AppError('Can not add allowance to a client that does not exists', 400));
    }
    if (!isValidAmount) {
      return next(new AppError('Can not add negative allowance', 400));
    }
    const allowance = await addAllowanceModel(
      req.app.get('db'),
      payload,
      staffId // system / supervisor making the credit
    );
    res
      .status(201) // 201 Created
      .json({ allowance });
  } catch (err: any) {
    next(new AppError(err.message || 'Problem occurred while adding allowance', 500));
  }
}
export async function cashTransaction(req: Request, res: Response, next: NextFunction) {
  const payload = req.body as CashTransactionInsert;

  /* -------- basic validation -------- */
  if (!payload?.resident_id) {
    return next(new AppError('resident_id must be provided', 400));
  }
  if (!Number.isInteger(payload.amount_cents) || payload.amount_cents === 0) {
    return next(new AppError('amount_cents must be a non-zero integer', 400));
  }
  if (!Number.isInteger(payload.entered_by)) {
    return next(new AppError('entered_by (staff ID) must be provided', 400));
  }

  /* -------- attach current allowance if client omitted it -------- */
  let allowanceId = payload.allowance_id;
  if (!allowanceId) {
    const current = await findOpenAllowance(req.app.get('db'), payload.resident_id);
    if (!current) {
      return next(new AppError('No open allowance for the resident; create one first', 409));
    }
    allowanceId = current.id;
  }

  try {
    const tx = await cashTransactionModel(req.app.get('db'), {
      ...payload,
      allowance_id: allowanceId,
    });

    res.status(201).json({ transaction: tx });
  } catch (err: any) {
    next(new AppError(err.message || 'Problem occurred while adding cash transaction', 500));
  }
}

export async function getDetailedClientFinanceSummary(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { resId } = req.params;
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;

  const id = Number(resId);
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('residentId must be a positive number', 400));
  }

  try {
    const summary = await getResidentFinanceSummary(req.app.get('db'), id, month);
    if (!summary) {
      return next(new AppError('No finance summary found for this resident', 404));
    }
    res.status(200).json(summary);
  } catch (err: any) {
    next(new AppError(err.message || 'Unable to get client finance summary', 500));
  }
}

export async function makeTransactionPdf(req: Request, res: Response, next: NextFunction) {
  const { resId } = req.params;
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;

  const id = Number(resId);
  if (!Number.isFinite(id) || id <= 0) {
    return next(new AppError('residentId must be a positive number', 400));
  }

  try {
    const summary = await getResidentFinanceSummary(req.app.get('db'), id, month);
    if (!summary) {
      return next(new AppError('No finance summary found for this resident', 404));
    }

    // Generate HTML with the correct month label
    const html = await exportTransactionsHtml({
      ...summary,
      // If month was provided, override monthName inside the template data
    });

    const fileName = `transactions-${id}.pdf`;
    const pdf = await generatePdfDoc(html, fileName);

    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      })
      .send(pdf);
  } catch (err: any) {
    next(new AppError(err.message || 'Error while generating transaction PDF', 500));
  }
}
