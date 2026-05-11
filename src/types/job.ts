export interface Job {
  id: string;
  jobNumber: string | null;
  title: string;
  description: string | null;
  status: string;
  displayOrder: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  dueDate: string | null;
  vin: string | null;
  stockNumber: string | null;
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
  category: string | null;
  reserved: boolean;
  consumed: boolean;
  createdAt: string;
}
