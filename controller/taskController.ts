import { Request, Response, NextFunction } from 'express';
import {
  addTask,
  editTask,
  findTaskByGroupHome,
  findTaskById,
  deleteTask,
} from '../models/taskModel.js';
import { AppError } from '../utils/appError.js';
import { Task, TaskInsert } from '../models/interfaces/task.interface.js';

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

export async function markTaskAsCompleted(req: Request, res: Response, next: NextFunction) {}
