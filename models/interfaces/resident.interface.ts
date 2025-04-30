export interface ResidentInsert {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  primaryDiagnosis: string[];
  allergies: string[];
  admissionDate: string;
  status: string;
  image_url?: string;
  public_id?: string;
  guardianId?: number;
  groupHomeId: number;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  healthcareNumber: string;
  phoneNumber?: string;
  isSelfGuardian: boolean;
  funderID?: number;
}

export interface ResidentFetch extends ResidentInsert {
  id: number;
}
export type ResidentDbInsert = Omit<ResidentInsert, 'primaryDiagnosis' | 'allergies'> & {
  primaryDiagnosis: string;
  allergies: string;
};
export type ResidentDbRow = ResidentDbInsert & { id: number };
