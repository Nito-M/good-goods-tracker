

## Fix PO Preview to Match Invoice/Quote Layout

### The Problem
The PO PDF **generator** (`purchaseOrderGenerator.ts`) was already updated to use the shared layout, but the **in-browser preview dialog** (`PurchaseOrderPreviewDialog.tsx`) was never updated. It ignores all layout visibility settings, so sections that should be hidden still show, making it look different from invoices/quotes.

### What Will Change

**`src/components/PurchaseOrderPreviewDialog.tsx`**
- Import `InvoiceLayout` and `defaultInvoiceLayout`
- Apply the safe merge: `const layout = { ...defaultInvoiceLayout, ...(settings?.layout || {}) }`
- Wrap each section with layout visibility checks to match the invoice preview:
  - Logo: only render when `layout.logo.visible`
  - Business Info: only render when `layout.businessInfo.visible`
  - Title: only render when `layout.invoiceTitle.visible`
  - PO Details: only render when `layout.invoiceDetails.visible`
  - Vendor: only render when `layout.billTo.visible`
  - Items Table: only render when `layout.itemsTable.visible`
  - Totals: only render when `layout.totals.visible`
  - Notes: only render when `layout.notes.visible`
  - Footer: only render when `layout.footer.visible`

This mirrors exactly what `InvoicePreviewDialog.tsx` already does, ensuring both the preview and the downloaded PDF respect the same layout settings.

### Files to Modify
- `src/components/PurchaseOrderPreviewDialog.tsx` -- add layout import, merge, and visibility checks on all sections

