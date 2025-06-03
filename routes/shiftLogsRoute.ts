import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { addLog, getLogById, getLogs } from '../controller/shiftLogsController.js';
const router = express.Router();
router.get('/logs/:homeId', checkAuth, getLogs);
router.get('/logs/:logId', checkAuth, getLogById);
router.post('/add-logs', checkAuth, addLog);

export default router;
