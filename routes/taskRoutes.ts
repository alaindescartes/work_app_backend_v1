import express from 'express';
import checkAuth, { checkRole } from '../utils/checkAuth.js';
import { addTaskData } from '../controller/taskController.js';

const router = express.Router();

router.post('/add-task', checkAuth, checkRole, addTaskData);

export default router;
