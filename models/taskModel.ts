import { Knex } from "knex";
import { TaskInsert, Task } from "./interfaces/task.interface.js";

export async function addTask(
  taskData: TaskInsert | TaskInsert[],
  knex: Knex
): Promise<Task[]> {
  const rows = await knex("tasks").insert(taskData).returning("*");
  return rows;
}

export async function findTaskById(taskId: number, knex: Knex): Promise<Task> {
  const task = await knex("tasks").where({ id: taskId }).first();

  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }
  return task;
}

export async function findTaskByGroupHome(
  homeId: number,
  knex: Knex
): Promise<Task[]> {
  if (!homeId) {
    throw new Error(`GroupHome ID is required`);
  }

  const tasks = await knex("tasks").where({ groupHomeId: homeId });
  return tasks;
}

export async function editTask(
  id: number,
  taskData: TaskInsert,
  knex: Knex
): Promise<Task> {
  const updated = await knex("tasks")
    .where({ id })
    .update(taskData)
    .returning("*");

  if (updated.length === 0) {
    throw new Error(`Task with id ${id} not found`);
  }

  return updated[0];
}
