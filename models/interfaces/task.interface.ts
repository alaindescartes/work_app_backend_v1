export interface Task {
  id: number;
  description: string;
  status: 'pending' | 'completed';
  groupHomeId: number;
  residentId?: number;
  completedAt?: string;
  completedBy: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskInsert = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedBy'>;
