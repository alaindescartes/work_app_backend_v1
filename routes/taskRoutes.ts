import express from "express";
import checkAuth, { checkRole } from "../utils/checkAuth.js";
import {
  addTaskData,
  deleteTaskById,
  editTaskData,
  getTaskBYHome,
} from "../controller/taskController.js";

const router = express.Router();

router.post("/add-task", checkAuth, checkRole, addTaskData);
router.post("/edit-task/:id", checkAuth, editTaskData);
router.get("/all-GroupHome-task/:homeId", checkAuth, getTaskBYHome);
router.delete("/delete-task/:id", checkRole, checkAuth, deleteTaskById);

export default router;
