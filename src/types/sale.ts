import { InvoiceLayout } from './invoiceLayout';

export interface SaleItem {
  id: string;
  saleId: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountRate: number;
  discountAmount: number;
  totalPrice: number;
  totalCost: number;
  profit: number;
  createdAt: string;
}

export type SaleStatus = 'draft' | 'sent' | 'picked_up' | 'paid' | 'overdue' | 'cancelled';

export interface Sale {
  id: string;
  userId: string;
  vendorId: string | null;
  vendorName?: string;
  vendorAddress?: string;
  contactPersonName?: string | null;
  invoiceNumber: string;
  status: SaleStatus;
  pickedUpAt: string | null;
  subtotal: number;
  totalCost: number;
  totalProfit: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  internalNotes: string | null;
  sentAt: string | null;
  paidAt: string | null;
  paymentTerms: string;
  dueDate: string | null;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  vendorId: string | null;
  contactPersonName?: string | null;
  invoiceNumber?: string | null;
  items: {
    inventoryItemId: string;
    itemName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    discountRate?: number;
  }[];
  taxRate: number;
  discountRate: number;
  notes: string | null;
  paymentTerms: string;
  dueDate: string | null;
  companyId?: string | null;
}

export interface InvoiceSettings {
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessNumber: string | null;
  thankYouNote: string | null;
  logoUrl: string | null;
  layout?: InvoiceLayout | null;
}
