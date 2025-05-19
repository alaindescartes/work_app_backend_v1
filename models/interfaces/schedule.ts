/****
 * Schedule represents an entry in the schedules table.
 */
export interface Schedule {
  id: number;
  residentId: number;
  groupHomeId: number;
  title: string;
  description: string;
  start_time: Date; // timestamp with timezone
  end_time: Date; // timestamp with timezone
  is_recurring: boolean;
  rrule?: string | null;
  schedule_type: 'appointment' | 'daily-care' | 'outing';
  assigned_staff_id?: number | null;
  status: 'scheduled' | 'completed' | 'canceled';
  completed_at?: Date | null;
  completed_by?: number | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * ScheduleInsert is used when creating a new schedule entry.
 * It omits auto‑generated fields like id, created_at, and updated_at.
 */
export interface ScheduleInsert {
  residentId: number;
  groupHomeId: number;
  title: string;
  description: string;
  start_time: Date; // timestamp with timezone
  end_time: Date; // timestamp with timezone
  is_recurring: boolean;
  rrule?: string | null;
  schedule_type: 'appointment' | 'daily-care' | 'outing';
  assigned_staff_id?: number | null;
  status?: 'scheduled' | 'completed' | 'canceled';
  completed_at?: Date | null;
  completed_by?: number | null;
  notes?: string | null;
}
