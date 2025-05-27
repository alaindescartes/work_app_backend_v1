import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { getIncidentReports, insertIncidentReport } from '../controller/reportController.js';
const router = express.Router();
router.post('/save-report', checkAuth, insertIncidentReport);
router.get('/get-reports/:homeId', checkAuth, getIncidentReports);
export default router;
