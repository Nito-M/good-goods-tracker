import { InvoiceLayout } from './invoiceLayout';

export interface QuoteItem {
  id: string;
  quoteId: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  quantityUnit: string;
  unitPrice: number;
  unitCost: number;
  totalPrice: number;
  notes: string | null;
  createdAt: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'sales_order';

export interface QuoteInvoiceLink {
  saleId: string;
  percentage: number;
  invoiceNumber?: string;
}

export interface Quote {
  id: string;
  userId: string;
  vendorId: string | null;
  vendorName?: string;
  vendorAddress?: string;
  quoteNumber: string;
  status: QuoteStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  paymentTerms: string;
  validUntil: string | null;
  attachmentUrl: string | null;
  convertedToInvoiceId: string | null;
  convertedToPoId: string | null;
  convertedToJobId: string | null;
  companyId?: string | null;
  items: QuoteItem[];
  hidePrices: boolean;
  showPaymentTerms: boolean;
  showSku: boolean;
  invoicedPercentage: number;
  linkedInvoices: QuoteInvoiceLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteInput {
  vendorId: string | null;
  quoteNumber?: string | null;
  items: {
    inventoryItemId: string | null;
    itemName: string;
    sku: string;
    quantity: number;
    quantityUnit: string;
    unitPrice: number;
    unitCost: number;
    notes: string | null;
  }[];
  taxRate: number;
  discountRate: number;
  notes: string | null;
  paymentTerms: string;
  validUntil: string | null;
  companyId?: string | null;
  hidePrices?: boolean;
  showPaymentTerms?: boolean;
  showSku?: boolean;
  createdAt?: string | null;
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
  validityDays?: number | null;
  defaultHidePrices?: boolean;
}
