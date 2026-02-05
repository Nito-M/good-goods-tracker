export interface PurchaseOrderItem {
  sku: string;
  itemName: string;
  quantity: number;
  unitCost?: number;
}

export interface PurchaseOrder {
  id: string;
  userId: string;
  poNumber: string | null;
  vendorId: string | null;
  vendorName?: string | null;
  pdfUrl: string | null;
  imageUrl: string | null;
  items: PurchaseOrderItem[];
  status: 'ordered' | 'received';
  orderedAt: Date;
  receivedAt: Date | null;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbPurchaseOrder {
  id: string;
  user_id: string;
  po_number: string | null;
  vendor_id: string | null;
  pdf_url: string | null;
  image_url: string | null;
  items: unknown;
  sku: string;
  item_name: string;
  quantity: number;
  status: string;
  ordered_at: string;
  received_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function dbToPurchaseOrder(db: DbPurchaseOrder, vendorName?: string | null): PurchaseOrder {
  // Support both old format (single item) and new format (items array)
  const rawItems = db.items as PurchaseOrderItem[] | null;
  const items: PurchaseOrderItem[] = rawItems && Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems
    : [{ sku: db.sku, itemName: db.item_name, quantity: db.quantity }];

  return {
    id: db.id,
    userId: db.user_id,
    poNumber: db.po_number,
    vendorId: db.vendor_id,
    vendorName,
    pdfUrl: db.pdf_url,
    imageUrl: db.image_url,
    items,
    status: db.status as 'ordered' | 'received',
    orderedAt: new Date(db.ordered_at),
    receivedAt: db.received_at ? new Date(db.received_at) : null,
    paidAt: db.paid_at ? new Date(db.paid_at) : null,
    notes: db.notes,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}
