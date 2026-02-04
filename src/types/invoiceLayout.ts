export interface ElementPosition {
  x: number;
  y: number;
  visible: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface InvoiceLayout {
  logo: ElementPosition;
  businessInfo: ElementPosition;
  invoiceTitle: ElementPosition;
  invoiceDetails: ElementPosition;
  billTo: ElementPosition;
  itemsTable: ElementPosition;
  totals: ElementPosition;
  notes: ElementPosition;
  footer: ElementPosition;
}

export const defaultInvoiceLayout: InvoiceLayout = {
  logo: { x: 20, y: 20, visible: true },
  businessInfo: { x: 140, y: 20, visible: true, align: 'right' },
  invoiceTitle: { x: 105, y: 60, visible: true, align: 'center' },
  invoiceDetails: { x: 20, y: 75, visible: true },
  billTo: { x: 20, y: 100, visible: true },
  itemsTable: { x: 20, y: 130, visible: true },
  totals: { x: 140, y: -1, visible: true, align: 'right' },
  notes: { x: 20, y: -1, visible: true },
  footer: { x: 105, y: -1, visible: true, align: 'center' },
};

export type InvoiceElementKey = keyof InvoiceLayout;

export const invoiceElementLabels: Record<InvoiceElementKey, string> = {
  logo: 'Logo',
  businessInfo: 'Business Info',
  invoiceTitle: 'Invoice Title',
  invoiceDetails: 'Invoice Details',
  billTo: 'Bill To',
  itemsTable: 'Items Table',
  totals: 'Totals',
  notes: 'Notes',
  footer: 'Footer',
};
