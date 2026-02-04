import { InvoiceLayout } from './invoiceLayout';

export interface QuoteItem {
  id: string;
  quoteId: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  createdAt: string;
}

export interface Quote {
  id: string;
  userId: string;
  vendorId: string | null;
  vendorName?: string;
  vendorAddress?: string;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  paymentTerms: string;
  validUntil: string | null;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteInput {
  vendorId: string | null;
  quoteNumber?: string | null;
  items: {
    inventoryItemId: string;
    itemName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
  }[];
  taxRate: number;
  discountRate: number;
  notes: string | null;
  paymentTerms: string;
  validUntil: string | null;
}

export interface QuoteSettings {
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessNumber: string | null;
  thankYouNote: string | null;
  logoUrl: string | null;
  layout?: InvoiceLayout | null;
  validityDays?: number;
}
