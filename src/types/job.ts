export interface Job {
  id: string;
  jobNumber: string | null;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobItem {
  id: string;
  jobId: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  createdAt: string;
}
