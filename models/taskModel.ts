import { Knex } from "knex";
import { TaskInsert } from "./interfaces/task.interface.js";

export async function addTask(
  taskData: TaskInsert | TaskInsert[],
  knex: Knex
): Promise<TaskInsert[]> {
  const rows = await knex("tasks").insert(taskData).returning("*");
  return rows;
}
