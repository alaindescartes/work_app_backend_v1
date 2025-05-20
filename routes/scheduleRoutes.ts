import express from 'express';
import {
  addSchedules,
  getSchedulesByHome,
  markScheduleAsCompletedOrCancelled,
} from '../controller/scheduleController.js';
import checkAuth from '../utils/checkAuth.js';

const router = express.Router();

router.post('/add-schedules', checkAuth, addSchedules);
router.get('/get-schedules/:homeId', checkAuth, getSchedulesByHome);
router.post('/change-schedule/:staffId/:id', checkAuth, markScheduleAsCompletedOrCancelled);

export default router;
