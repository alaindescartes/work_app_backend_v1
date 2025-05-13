export interface Task {
  id: number;
  taskType: string;
  assignedToStaffId: number;
  residentId?: number; // Nullable if not assigned to a specific resident
  taskStatus: "pending" | "in_progress" | "completed";
  completionTime?: string; // ISO string (nullable)
  taskPriority: "low" | "medium" | "high";
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type TaskInsert = Omit<Task, "id" | "createdAt" | "updatedAt">;
