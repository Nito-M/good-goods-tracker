export type RequestStatus = 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';

export interface Request {
  id: string;
  userId: string;
  requestNumber: string | null;
  title: string | null;
  inventoryItemId: string | null;
  itemName: string;
  sku: string | null;
  quantity: number;
  quantityUnit: string;
  price: number;
  gstRate: number;
  extraCost: number;
  extraCostLabel: string;
  link: string | null;
  notes: string | null;
  imageUrl: string | null;
  pdfUrl: string | null;
  needByDate: string | null;
  requesterName: string | null;
  bankCardId: string | null;
  vendorName: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RequestSubItem {
  id: string;
  requestId: string;
  userId: string;
  vendorName: string;
  unitPrice: number;
  quantity: number;
  link: string | null;
  notes: string | null;
  isSelected: boolean;
  createdAt: string;
}

export interface CreateRequestInput {
  inventoryItemId: string | null;
  itemName: string;
  sku: string | null;
  quantity: number;
  quantityUnit: string;
  price: number;
  gstRate: number;
  extraCost: number;
  extraCostLabel: string;
  link: string | null;
  notes: string | null;
  imageUrl: string | null;
  pdfUrl?: string | null;
  needByDate: string | null;
  requesterName: string | null;
  requestNumber?: string | null;
  vendorName?: string | null;
}
