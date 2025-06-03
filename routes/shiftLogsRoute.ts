import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { addLog, getLogById, getLogs, updateLog } from '../controller/shiftLogsController.js';
const router = express.Router();
router.get('/logs/:homeId', checkAuth, getLogs);
router.get('/get-logs-id/:logId', checkAuth, getLogById);
router.post('/add-logs', checkAuth, addLog);
router.post('/edit-log/:logId', checkAuth, updateLog);

export default router;
