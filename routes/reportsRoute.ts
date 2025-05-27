import express from 'express';
import checkAuth, { checkRole } from '../utils/checkAuth.js';
import {
  editIncidentReport,
  getIncidentReportById,
  getIncidentReports,
  insertIncidentReport,
} from '../controller/reportController.js';
const router = express.Router();
router.post('/save-report', checkAuth, insertIncidentReport);
router.get('/get-reports/:homeId', checkAuth, getIncidentReports);
router.get('/get-reportById/:id', checkAuth, checkRole, getIncidentReportById);
router.post('/edit-report/:id', checkAuth, checkRole, editIncidentReport);
export default router;
