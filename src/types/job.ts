export interface Job {
  id: string;
  jobNumber: string | null;
  title: string;
  description: string | null;
  status: string;
  displayOrder: number;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  dueDate: string | null;
  vin: string | null;
  stockNumber: string | null;
  quoteNumber: string | null;
  salesOrderNumber: string | null;
  invoiceNumber: string | null;
  weight: number | null;
  nvisLink: string | null;
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
  subcategory: string | null;
  reserved: boolean;
  consumed: boolean;
  createdAt: string;
}
