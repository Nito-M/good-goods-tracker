

## Plan: Pass Company Details from Quote to Invoice on Conversion

### Problem
When converting a quote to an invoice, the `company_id` is not carried over. This means the invoice loses the logo, business name, address, and other company branding that was set on the quote.

### Changes

**`src/hooks/useQuotes.ts`** — `convertToInvoice` function (~line 484):
- Add `company_id: quote.companyId || null` to the sales insert object

This single change ensures the invoice inherits the same company profile (logo, name, address, phone, email, business number, thank-you note) as the quote, since the invoice preview and PDF generator already read company details from the `company_id` on the sale.

### No other changes needed
The existing invoice preview (`InvoicePreviewDialog`) and PDF generator (`invoiceGenerator`) already resolve company settings from the sale's `company_id`. The company data (logo, address, etc.) will automatically appear once the ID is passed through.

