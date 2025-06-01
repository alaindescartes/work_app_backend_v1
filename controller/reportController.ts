import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import {
  IncidentReportFetch,
  IncidentReportInsert,
  IncidentReportSupervisorUpdate,
} from '../models/interfaces/incidentReport.interface.js';
import {
  addIncidentReport,
  editFollowUpModel,
  getIncidentFollowUpByIdModel,
  getIncidentFollowUpModel,
  getIncidentReportByIdModel,
  getIncidentReportsModel,
  updateReportModel,
} from '../models/reportsModel.js';
import { generatePdfDoc } from '../utils/generatePdfDoc.js';
import { renderReportHtml } from '../utils/renderReportHtml.js';
import { getStaffById } from '../models/staffModel.js';
import { findResidentById } from '../models/residentModel.js';
import { IncidentFollowUpInsert } from '../models/interfaces/incident-followUps.interface.js';

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

export async function getIncidentReportById(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) return next(new AppError('Provide valid id', 400));
  try {
    const report = await getIncidentReportByIdModel(req.app.get('db'), Number(id));
    if (!report) return next(new AppError('Could not get report', 400));
    res.status(200).json({ report: report });
  } catch (err: any) {
    return next(new AppError(err.message || 'Error while fetching report', 500));
  }
}

export async function editIncidentReport(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) return next(new AppError('Provide valid id', 400));
  const report: IncidentReportSupervisorUpdate = req.body;
  if (!report) return next(new AppError('Provide valid report', 400));
  console.log('received', report);
  try {
    const updatedReport = await updateReportModel(req.app.get('db'), Number(id), report);
    if (!updatedReport) return next(new AppError('Could not update report', 400));
    res.status(201).json({ report: updatedReport });
  } catch (err: any) {
    return next(new AppError(err.message || 'Error while adding report', 500));
  }
}

export async function makePdf(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) return next(new AppError('Provide valid id', 400));
  try {
    const report = await getIncidentReportByIdModel(req.app.get('db'), Number(id));
    if (!report) return next(new AppError('Could not get report', 400));

    const [staff, resident] = await Promise.all([
      getStaffById(req.app.get('db'), Number(report.staffId)),
      findResidentById(req.app.get('db'), Number(report.residentId)),
    ]);

    if (!staff)
      return next(new AppError(`Staff record #${report.staffId} not found – PDF aborted`, 404));
    if (!resident)
      return next(
        new AppError(`Resident record #${report.residentId} not found – PDF aborted`, 404)
      );

    const staffName = `${staff.firstName} ${staff.lastName}`;
    const residentName = `${resident.firstName} ${resident.lastName}`;
    const html = await renderReportHtml(report, residentName, staffName);
    const pdf = await generatePdfDoc(html, `incident-${id}.pdf`);
    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="incident-${id}.pdf"`,
      })
      .send(pdf);
  } catch (err: any) {
    return next(new AppError(err.message || 'Error while makePdf', 500));
  }
}
export async function getFollowUps(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) return next(new AppError('Provide valid id', 400));
  try {
    const followUp = await getIncidentFollowUpByIdModel(req.app.get('db'), Number(id));
    if (!followUp) return next(new AppError('Could not get follow up report', 400));
    res.status(200).json({ followUp: followUp });
  } catch (err: any) {
    return next(new AppError(err.message || 'Error while fetching follow up report', 500));
  }
}
export async function updateFollowUp(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const followUp: IncidentFollowUpInsert = req.body;
  console.log('received', followUp);
  console.log('id', id);
  if (!id) {
    return next(new AppError('Provide valid id', 400));
  }
  try {
    // Merge the PATCH fields with the required primary‑key
    const updated = await editFollowUpModel(req.app.get('db'), {
      id: Number(id),
      ...followUp,
    });
    if (!updated) {
      return next(new AppError('Could not update follow‑up', 400));
    }
    res.status(200).json({ followUp: updated });
  } catch (e: any) {
    return next(new AppError(e.message || 'Error while updating follow up report', 500));
  }
}

export async function getAllFollowUps(req: Request, res: Response, next: NextFunction) {
  const { homeId } = req.params;
  try {
    const followUps = await getIncidentFollowUpModel(req.app.get('db'), Number(homeId));
    if (!followUps) return next(new AppError('Could not get follow up report', 400));
    res.status(200).json({ followUps: followUps });
  } catch (e: any) {
    return next(new AppError(e.message || 'Error while fetching follow up reports', 500));
  }
}
