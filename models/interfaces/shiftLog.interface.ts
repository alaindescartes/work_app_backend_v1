/* ---------------------------------------------------------------------
 * Interfaces for creating and deleting shift‑log records
 * ------------------------------------------------------------------- */

/** Shape of a new shift‑log entry that will be inserted via the API. */
export interface ShiftLogInsert {
  /** FK → group_homes.id */
  home_id: number;

  /** Authoring staff FK → staff.staffId */
  staff_id: number;

  /** Optional FK → residents.id (null if note is home‑wide) */
  resident_id?: number | null;

  /** Inclusive shift start in ISO‑8601 format (e.g. '2025-06-03T06:00:00-06:00') */
  shift_start: string;

  /** Inclusive shift end in ISO‑8601 format */
  shift_end: string;

  /** Mark the note as critical so it is highlighted for the next shift */
  is_critical?: boolean;

  /** The hand‑over message (Markdown or plain text) */
  note: string;
}

/**
 * Row shape returned when fetching shift‑log entries.
 * Includes author (staff) names and the DB‑generated id / timestamps.
 */
export interface ShiftLogFetch {
  id: number;
  home_id: number;
  staff_id: number;
  staffFirstName: string;
  staffLastName: string;
  resident_id: number | null;
  shift_start: string; // ISO string
  shift_end: string; // ISO string
  created_at: string; // ISO string (server tz)
  is_critical: boolean;
  note: string;
}
