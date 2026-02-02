export interface SaleItem {
  id: string;
  saleId: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  userId: string;
  vendorId: string | null;
  vendorName?: string;
  invoiceNumber: string;
  status: 'draft' | 'completed' | 'cancelled';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  paymentTerms: string;
  dueDate: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  vendorId: string | null;
  items: {
    inventoryItemId: string;
    itemName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }[];
  taxRate: number;
  discountRate: number;
  notes: string | null;
  paymentTerms: string;
  dueDate: string | null;
}

export interface InvoiceSettings {
  logoUrl: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  thankYouNote: string | null;
}
