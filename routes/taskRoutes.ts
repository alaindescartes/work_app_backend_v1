import express from 'express';
import checkAuth, { checkRole } from '../utils/checkAuth.js';
import { addTaskData, editTaskData, markTaskAsCompleted } from '../controller/taskController.js';

const router = express.Router();

router.post('/add-task', checkAuth, checkRole, addTaskData);
router.post('/edit-task/:id', checkAuth, editTaskData);

export default router;
