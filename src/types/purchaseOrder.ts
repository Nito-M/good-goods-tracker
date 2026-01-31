export interface PurchaseOrder {
  id: string;
  userId: string;
  pdfUrl: string | null;
  imageUrl: string | null;
  sku: string;
  itemName: string;
  quantity: number;
  status: 'ordered' | 'received';
  orderedAt: Date;
  receivedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbPurchaseOrder {
  id: string;
  user_id: string;
  pdf_url: string | null;
  image_url: string | null;
  sku: string;
  item_name: string;
  quantity: number;
  status: string;
  ordered_at: string;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function dbToPurchaseOrder(db: DbPurchaseOrder): PurchaseOrder {
  return {
    id: db.id,
    userId: db.user_id,
    pdfUrl: db.pdf_url,
    imageUrl: db.image_url,
    sku: db.sku,
    itemName: db.item_name,
    quantity: db.quantity,
    status: db.status as 'ordered' | 'received',
    orderedAt: new Date(db.ordered_at),
    receivedAt: db.received_at ? new Date(db.received_at) : null,
    notes: db.notes,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}
