export interface Task {
  id: number;
  description: string;
  status: "pending" | "completed";
  groupHomeId: number;
  residentId?: number;
  completedAt?: string;
  completedBy: number;
  createdAt: string;
  updatedAt: string;
}
export interface CompletedTask {
  id: number;
  description: string;
  status: "completed" | "not-done";
  groupHomeId: number;
  residentId?: number;
  completedAt?: string;
  completedBy: number;
  createdAt: string;
  updatedAt: string;
  reason?: string;
}

export type TaskInsert = Omit<
  Task,
  "id" | "createdAt" | "updatedAt" | "completedBy"
>;
