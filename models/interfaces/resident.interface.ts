export interface ResidentInsert {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  primaryDiagnosis: string[];
  allergies: string[];
  admissionDate: string;
  status: string;
  image_url: string;
  guardianId?: number;
  groupHomeId: number;
  marital_status: "single" | "married" | "divorced" | "widowed";
  healthcareNumber: string;
  phoneNumber?: string;
  isSelfGuardian: boolean;
  funderID?: number;
}

export interface ResidentFetch extends ResidentInsert {
  id: number;
}
