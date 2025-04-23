export interface StaffBase {
  staffId?: number;
  firstName: string;
  lastName: string;
  role: "user" | "supervisor" | "admin";
  phoneNumber: string;
  hireDate: string;
  status: "active" | "inactive";
  email: string;
  created_at?: Date;
  updated_at?: Date;
  password: string;
}
