import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import {
  IncidentReportFetch,
  IncidentReportInsert,
} from '../models/interfaces/incidentReport.interface.js';
import { addIncidentReport } from '../models/reportsModel.js';

export async function insertIncidentReportFetch(req: Request, res: Response, next: NextFunction) {
  const report: IncidentReportInsert = req.body;
  if (!report) return next(new AppError('Provide valid report', 400));
  console.log('received', report);
  try {
    const insertedReport = await addIncidentReport(req.app.get('db'), report);
    if (!insertedReport) return next(new AppError('could not add report', 400));
    res.status(201).json({ report: insertedReport });
  } catch (err: any) {
    return next(new AppError(err.message || 'Error while adding report', 500));
  }
}
