import { Request, Response, NextFunction } from "express";
import { addTask } from "../models/taskModel.js";
import { AppError } from "../utils/appError.js";
import { TaskInsert } from "../models/interfaces/task.interface.js";

export async function addTaskData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const taskData: TaskInsert | TaskInsert[] = req.body;
  if (!taskData || (Array.isArray(taskData) && taskData.length === 0)) {
    return next(new AppError("Task data is required", 400));
  }

  try {
    //insert task in the db
    const addedtask = await addTask(taskData, req.app.get("db"));

    //added task successfully
    res
      .status(200)
      .json({ message: "Tasks added successfully", tasks: addedtask });
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.log("unable to insert task", error.message);
    }
    return next(
      new AppError(error.message || "an error occured while adding tasks", 500)
    );
    //TODO:log error to a logging system
  }
}
