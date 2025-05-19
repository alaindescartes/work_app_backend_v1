import { Request, Response, NextFunction } from 'express';
import {
  addTask,
  editTask,
  findTaskByGroupHome,
  findTaskById,
  deleteTask,
  addCompletedTask,
  fetchTodayCompletedTasks,
} from '../models/taskModel.js';
import { AppError } from '../utils/appError.js';
import { CompletedTask, Task, TaskInsert } from '../models/interfaces/task.interface.js';

/**
 * Controller to handle task creation requests.
 *
 * Accepts a single task or an array of tasks from the request body and inserts them into the database.
 *
 * @param {Request} req - Express request object containing task data in the body.
 * @param {Response} res - Express response object used to return success status and added tasks.
 * @param {NextFunction} next - Express next function for error handling.
 *
 * @returns {Promise<void>} Sends a JSON response on success or calls `next` with an error.
 */
export async function addTaskData(req: Request, res: Response, next: NextFunction): Promise<void> {
  const taskData: TaskInsert | TaskInsert[] = req.body;
  if (!taskData || (Array.isArray(taskData) && taskData.length === 0)) {
    return next(new AppError('Task data is required', 400));
  }

  try {
    //insert task in the db
    const addedtask = await addTask(taskData, req.app.get('db'));

    //added task successfully
    res.status(200).json({ message: 'Tasks added successfully', tasks: addedtask });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('unable to insert task', error.message);
    }
    return next(new AppError(error.message || 'an error occured while adding tasks', 500));
    //TODO:log error to a logging system
  }
}

/**
 * Controller to handle editing a task by ID.
 *
 * Validates the task ID from the request parameters, checks for the task's existence,
 * and updates it with the provided data from the request body.
 *
 * @param {Request} req - Express request object containing task ID in params and updated data in body.
 * @param {Response} res - Express response object used to return the updated task.
 * @param {NextFunction} next - Express next function for error handling.
 *
 * @returns {Promise<void>} Sends a JSON response with the updated task or forwards an error to middleware.
 */
export async function editTaskData(req: Request, res: Response, next: NextFunction): Promise<void> {
  const taskData: TaskInsert = req.body;
  const { id } = req.params;

  const taskId = Number(id);
  if (isNaN(taskId)) {
    return next(new AppError('Invalid task ID', 400));
  }

  if (!id) {
    return next(new AppError('task id must be provided', 400));
  }

  try {
    const taskToEdit = await findTaskById(taskId, req.app.get('db'));

    //task not found
    if (!taskToEdit) {
      return next(new AppError('there was not task with that id found', 404));
    }

    //task is found
    const editedTask = await editTask(taskId, taskData, req.app.get('db'));

    res.status(200).json({ message: 'Task edited successfully', task: editedTask });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('unable to edit task', error.message);
    }
    return next(new AppError(error.message || 'an error occured while editing tasks', 500));
    //TODO:log error to a logging system
  }
}

/**
 * Retrieve all tasks that belong to a specific group_home.
 *
 * Route param:
 *   - `homeId` _the numeric ID of the group home whose tasks you want.
 *
 * Response Codes
 *   200 _Returns an array of tasks.
 *   400 _`homeId` is missing or not a number.
 *   404 _No tasks found for that group home.
 *   500 _Unexpected server/database error.
 */
export async function getTaskBYHome(req: Request, res: Response, next: NextFunction) {
  const { homeId } = req.params;

  if (!homeId) {
    return next(new AppError('invalid HomeId provided', 400));
  }

  try {
    const fetchedTask: Task[] = await findTaskByGroupHome(Number(homeId), req.app.get('db'));

    if (!fetchedTask || fetchedTask.length === 0) {
      return next(new AppError('No task found at the moment', 404));
    }

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      tasks: fetchedTask,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('unable to edit task', error.message);
    }
    return next(new AppError(error.message || 'an error occured while getting tasks', 500));
    //TODO:log error to a logging system
  }
}

/**
 * Permanently delete a task by its primary_key ID.
 *
 * Route param:
 *   - `id` _task ID to delete.
 *
 * Response Codes
 *   200 _Task deleted, returns the deleted row.
 *   400 _Missing or invalid ID.
 *   404 _Task not found.
 *   500 _Unexpected server/database error.
 */
export async function deleteTaskById(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Task ID is required to delete task', 400));
  }

  const taskId = Number(id);
  if (isNaN(taskId)) {
    return next(new AppError('Invalid task ID', 400));
  }

  try {
    const taskToDelete = await deleteTask(taskId, req.app.get('db'));
    if (!taskToDelete) {
      return next(new AppError('Task not found', 404));
    }

    res.status(200).json({
      message: 'Task deleted successfully',
      task: taskToDelete,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('unable to delete task', error.message);
    }
    return next(new AppError(error.message || 'An error occurred while deleting the task', 500));
    //TODO:log error to a logging system
  }
}

/**
 * Save one or many completed‑task records.
 *
 * The request body may contain a single `CompletedTask` object or an array
 * of them.  Each object must minimally include:
 *   - `taskId`         – FK reference to the template task
 *   - `groupHomeId`    – FK for fast filtering
 *   - `completedAt`    – ISO timestamp of completion
 *   - `completedBy`    – staff ID
 *
 * Route: `POST /api/completed-tasks`
 *
 * Response codes
 *   201 – All rows inserted; returns the saved rows.
 *   400 – Body missing or empty.
 *   500 – Database/unknown failure.
 *
 * @param req  Express request – completed‑task payload in `req.body`.
 * @param res  Express response – returns `201` with inserted rows.
 * @param next Express next – forwards `AppError` on validation/db errors.
 */
export async function processCompletedTask(req: Request, res: Response, next: NextFunction) {
  const taskData: CompletedTask | CompletedTask[] = req.body;

  if (!taskData || (Array.isArray(taskData) && taskData.length === 0)) {
    return next(new AppError('Completed-task data is required', 400));
  }

  // Normalize: ensure every payload row has a valid taskId
  const normalized: CompletedTask[] = (Array.isArray(taskData) ? taskData : [taskData]).map(
    (row) => {
      if (!row.taskId && (row as any).id) {
        // Fall back to `id` if it was mistakenly sent
        row.taskId = (row as any).id;
        delete (row as any).id;
      }

      if (!row.taskId) {
        throw new AppError('taskId is required for each completed-task record', 400);
      }

      return row;
    }
  );

  try {
    const saved = await addCompletedTask(normalized, req.app.get('db'));

    res.status(201).json({
      message: 'Completed task(s) saved',
      tasks: saved,
    });
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unable to save completed tasks:', err.message);
    }
    next(new AppError(err.message || 'Error occurred while saving completed tasks', 500));
  }
}

export async function getTodaysCompletedTasks(req: Request, res: Response, next: NextFunction) {
  const { homeId } = req.params;
  try {
    const taskData = await fetchTodayCompletedTasks(req.app.get('db'), Number(homeId));
    if (!taskData) {
      return next(new AppError('No completed task found for this home', 404));
    }
    res.status(200).json({ message: 'success', tasks: taskData });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("unable to get today'sCompletedTasks", error.message);
    }
    //TODO:log to a logging service
    return next(new AppError("could not find today'sCompletedTasks", 500));
  }
}

/**
 * Mark a task as completed (future implementation).
 *
 * Intended behaviour:
 *   1. Validate task ID in params.
 *   2. Update the tasks `status` to `"completed"` and set `completedAt`.
 *
 * Currently a stub implement in the future.
 *
 * @todo Implement database update logic.
 */
export async function markTaskAsCompleted(req: Request, res: Response, next: NextFunction) {}
