export interface PurchaseOrderItem {
  sku: string;
  itemName: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
  receivedQuantity?: number;
  inventoryItemId?: string | null;
}

export function getPurchaseOrderItemKey(item: PurchaseOrderItem): string {
  const sku = item.sku?.trim().toLowerCase();
  if (sku) return `sku:${sku}`;

  const inventoryItemId = item.inventoryItemId?.trim();
  if (inventoryItemId) return `inventory:${inventoryItemId}`;

  return `name:${item.itemName.trim().toLowerCase()}`;
}

export function getDuplicatePurchaseOrderItems(items: PurchaseOrderItem[]) {
  const counts = new Map<string, { label: string; count: number }>();

  for (const item of items) {
    const key = getPurchaseOrderItemKey(item);
    const label = item.sku?.trim() || item.itemName;
    const current = counts.get(key);
    counts.set(key, { label, count: (current?.count || 0) + 1 });
  }

  return Array.from(counts.values()).filter((entry) => entry.count > 1);
}

export function dedupePurchaseOrderItems(items: PurchaseOrderItem[]): PurchaseOrderItem[] {
  const seen = new Set<string>();
  const deduped: PurchaseOrderItem[] = [];

  for (const item of items) {
    const key = getPurchaseOrderItemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}


export interface PoAttachment {
  id: string;
  purchaseOrderId: string;
  url: string;
  fileType: 'image' | 'pdf';
  fileName: string | null;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  userId: string;
  poNumber: string | null;
  vendorId: string | null;
  vendorName?: string | null;
  requestId: string | null;
  requestNumber?: string | null;
  jobIds: string[];
  jobNumbers?: string[];
  pdfUrl: string | null;
  imageUrl: string | null;
  attachments?: PoAttachment[];
  items: PurchaseOrderItem[];
  status: 'draft' | 'ordered' | 'partially_received' | 'received';
  orderedAt: Date;
  receivedAt: Date | null;
  partiallyReceivedAt: Date | null;
  paidAt: Date | null;
  notes: string | null;
  internalNotes: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  pstPercent: number;
  gstEnabled: boolean;
  companyId: string | null;
  companyName?: string | null;
  bankCardId: string | null;
  contactPersonName: string | null;
  vendorInvoiceNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbPurchaseOrder {
  id: string;
  user_id: string;
  po_number: string | null;
  vendor_id: string | null;
  request_id: string | null;
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
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  created_at: string;
  updated_at: string;
}

export function dbToPurchaseOrder(db: DbPurchaseOrder, vendorName?: string | null, requestNumber?: string | null, jobIds?: string[], jobNumbers?: string[], companyName?: string | null): PurchaseOrder {
  // Support both old format (single item) and new format (items array)
  const rawItems = db.items as PurchaseOrderItem[] | null;
  const items: PurchaseOrderItem[] = rawItems && Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems
    : [{ sku: db.sku, itemName: db.item_name, quantity: db.quantity }];
  const dedupedItems = dedupePurchaseOrderItems(items);

  return {
    id: db.id,
    userId: db.user_id,
    poNumber: db.po_number,
    vendorId: db.vendor_id,
    vendorName,
    requestId: db.request_id,
    requestNumber,
    jobIds: jobIds || [],
    jobNumbers: jobNumbers || [],
    pdfUrl: db.pdf_url,
    imageUrl: db.image_url,
    items: dedupedItems,
    status: db.status as 'draft' | 'ordered' | 'partially_received' | 'received',
    orderedAt: new Date(db.ordered_at),
    receivedAt: db.received_at ? new Date(db.received_at) : null,
    partiallyReceivedAt: (db as any).partially_received_at ? new Date((db as any).partially_received_at) : null,
    paidAt: db.paid_at ? new Date(db.paid_at) : null,
    notes: db.notes,
    internalNotes: (db as any).internal_notes ?? null,
    discountType: (db.discount_type as 'percentage' | 'fixed') || 'percentage',
    discountValue: db.discount_value || 0,
    discountAmount: db.discount_amount || 0,
    pstPercent: Number((db as any).pst_percent) || 0,
    gstEnabled: (db as any).gst_enabled ?? true,
    companyId: (db as any).company_id || null,
    companyName,
    bankCardId: (db as any).bank_card_id || null,
    contactPersonName: (db as any).contact_person_name || null,
    vendorInvoiceNumber: (db as any).vendor_invoice_number || null,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}
