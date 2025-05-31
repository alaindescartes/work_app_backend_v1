import express from 'express';
import checkAuth, { checkRole } from '../utils/checkAuth.js';
import {
  editIncidentReport,
  getAllFollowUps,
  getFollowUps,
  getIncidentReportById,
  getIncidentReports,
  insertIncidentReport,
  makePdf,
  updateFollowUp,
} from '../controller/reportController.js';
const router = express.Router();
router.post('/save-report', checkAuth, insertIncidentReport);
router.get('/get-reports/:homeId', checkAuth, getIncidentReports);
router.get('/get-reportById/:id', checkAuth, checkRole, getIncidentReportById);
router.patch('/edit-report/:id', checkAuth, checkRole, editIncidentReport);
router.get('/get-pdf/:id', checkAuth, checkRole, makePdf);
router.get('/follow-up/:id', checkAuth, checkRole, getFollowUps);
router.get('/getAll-follow-up/:homeId', checkAuth, checkRole, getAllFollowUps);
router.patch('edit-follow-up/:id', checkAuth, checkRole, updateFollowUp);
export default router;
