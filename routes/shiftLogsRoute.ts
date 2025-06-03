import express from 'express';
import checkAuth from '../utils/checkAuth.js';
import { addLog, getLogs } from '../controller/shiftLogsController.js';
const router = express.Router();
router.get('/logs', checkAuth, getLogs);
router.post('/add-logs', checkAuth, addLog);

export default router;
