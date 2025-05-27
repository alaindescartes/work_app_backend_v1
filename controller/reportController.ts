import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import {
  IncidentReportFetch,
  IncidentReportInsert,
} from '../models/interfaces/incidentReport.interface.js';
import { addIncidentReport, getIncidentReportsModel } from '../models/reportsModel.js';

export async function insertIncidentReport(req: Request, res: Response, next: NextFunction) {
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

export async function getIncidentReports(req: Request, res: Response, next: NextFunction) {
  const { homeId } = req.params;
  if (!homeId) return next(new AppError('Provide valid groupHomeId', 400));
  try {
    const reports = await getIncidentReportsModel(req.app.get('db'), Number(homeId));
    if (!reports) return next(new AppError('Could not get reports', 400));
    res.status(200).json({ reports: reports });
  } catch (err: any) {
    return next(new AppError(err.message || 'Error while fetching reports', 500));
  }
}
