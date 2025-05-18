import { Knex } from 'knex';
import { TaskInsert, Task, CompletedTask } from './interfaces/task.interface.js';
import { DateTime } from 'luxon';

export async function addTask(taskData: TaskInsert | TaskInsert[], knex: Knex): Promise<Task[]> {
  const rows = await knex('tasks').insert(taskData).returning('*');
  return rows;
}

export async function findTaskById(taskId: number, knex: Knex): Promise<Task> {
  const task = await knex('tasks').where({ id: taskId }).first();

  if (!task) {
    throw new Error(`Task with id ${taskId} not found`);
  }
  return task;
}

export async function findTaskByGroupHome(homeId: number, knex: Knex): Promise<Task[]> {
  if (!homeId) {
    throw new Error(`GroupHome ID is required`);
  }

  const tasks = await knex('tasks').where({ groupHomeId: homeId });
  return tasks;
}

export async function fetchTodayCompletedTasks(
  knex: Knex,
  homeId?: number
): Promise<CompletedTask[]> {
  // Build start/end in America/Edmonton
  const start = DateTime.now().setZone('America/Edmonton').startOf('day').toJSDate(); // JS Date in local zone
  const end = DateTime.fromJSDate(start).plus({ days: 1 }).toJSDate();

  const q = knex('completedTasks')
    .where('completedAt', '>=', start)
    .andWhere('completedAt', '<', end);

  if (homeId) q.andWhere('groupHomeId', homeId);

  return q;
}

export async function editTask(id: number, taskData: TaskInsert, knex: Knex): Promise<Task> {
  const updated = await knex('tasks').where({ id }).update(taskData).returning('*');

  if (updated.length === 0) {
    throw new Error(`Task with id ${id} not found`);
  }

  return updated[0];
}

export async function deleteTask(id: number, knex: Knex): Promise<Task> {
  if (!id) {
    throw new Error('Task ID is required');
  }

  const TaskToDelete = await knex('tasks').where({ id }).delete().returning('*');

  if (TaskToDelete.length === 0) {
    throw new Error(`Task with id ${id} not found`);
  }

  return TaskToDelete[0];
}

export async function addCompletedTask(
  taskData: CompletedTask | CompletedTask[],
  knex: Knex
): Promise<Task[]> {
  const rows = await knex('completedTasks').insert(taskData).returning('*');
  return rows;
}
