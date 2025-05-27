import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { insertIncidentReportFetch } from '../controller/reportController.js';
const router = express.Router();
router.post('/save-report', checkAuth, insertIncidentReportFetch);
export default router;
