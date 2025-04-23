export interface GroupHomeInsert {
  name: string;
  address: string;
  phone: string;
  image_url?: string;
  cloudinary_public_id?: string;
  status: string;
  managerName?: string;
  supervisorName?: string;
  type?: string;
  notes?: string;
}

export interface GroupHomeFetch extends GroupHomeInsert {
  id: number;
  createdAt: Date;
}
