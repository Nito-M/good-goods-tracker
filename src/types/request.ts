export type RequestStatus = 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';

export interface Request {
  id: string;
  userId: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string | null;
  quantity: number;
  quantityUnit: string;
  link: string | null;
  notes: string | null;
  imageUrl: string | null;
  needByDate: string | null;
  requesterName: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestInput {
  inventoryItemId: string | null;
  itemName: string;
  sku: string | null;
  quantity: number;
  quantityUnit: string;
  link: string | null;
  notes: string | null;
  imageUrl: string | null;
  needByDate: string | null;
  requesterName: string | null;
}
