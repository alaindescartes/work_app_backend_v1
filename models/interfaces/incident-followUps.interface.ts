/**
 * Canonical shape of a follow‑up task as stored in the DB.
 * Field naming mirrors the database column names (snake_case).
 */
export interface IncidentFollowUp {
  id: number; // PK
  incidentId: number; // FK → incident_reports.id
  title: string;
  details?: string;
  dueDate?: Date; // Date only (no TZ)
  completedAt?: Date; // timestamp with time zone
  status: 'InProgress' | 'Closed'; // defaults “InProgress”
  assignedToStaffId?: number; // FK → staff.id
  created_at: Date;
  updated_at: Date;
}

/**
 * Row returned from SELECT * (created/updated dates populated).
 */
export type IncidentFollowUpFetch = IncidentFollowUp;

/**
 * Payload for INSERT (POST). Server auto‑generates id, timestamps.
 * • status defaults to "InProgress" if omitted.
 */
export type IncidentFollowUpInsert = Omit<IncidentFollowUp, 'id' | 'created_at' | 'updated_at'> & {
  status?: 'InProgress' | 'Closed';
};
