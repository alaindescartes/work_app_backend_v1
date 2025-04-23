export interface GroupHomeInsert {
  name: string;
  address: string;
  phone: string;
  image_url?: string;
  status: string;
  managerId?: number;
  type?: string;
  notes?: string;
}

export interface GroupHomeFetch extends GroupHomeInsert {
  id: number;
  createdAt: Date;
}
