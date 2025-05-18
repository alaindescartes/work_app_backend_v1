import express from 'express';
import checkAuth, { checkRole } from '../utils/checkAuth.js';
import {
  addTaskData,
  deleteTaskById,
  editTaskData,
  getTaskBYHome,
  getTodaysCompletedTasks,
  processCompletedTask,
} from '../controller/taskController.js';

const router = express.Router();

router.post('/add-task', checkAuth, checkRole, addTaskData);
router.post('/edit-task/:id', checkAuth, checkRole, editTaskData);
router.get('/all-GroupHome-task/:homeId', checkAuth, getTaskBYHome);
router.delete('/delete-task/:id', checkRole, checkAuth, deleteTaskById);
router.post('/save-task', checkAuth, processCompletedTask);
router.get('/get-completed-tasks/:homeId', checkAuth, getTodaysCompletedTasks);

export default router;
