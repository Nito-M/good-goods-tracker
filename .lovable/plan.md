## Add "Show Part #" toggle to invoices

Mirror the pattern already used for quotes (`show_sku`) so users can hide the Part # (SKU) column on the invoice PDF and preview.

### Database
- Migration: add `show_sku boolean not null default true` to `sales` table.

### Types & hooks
- `src/types/sale.ts`: add `showSku?: boolean` to Sale + create-input types.
- `src/hooks/useSales.ts`: read `show_sku` into `showSku` (default `true`); write it on create/update.

### UI — toggle
- `src/pages/Sales.tsx` (new invoice flow): add `showSku` state (default true), include in saved payload, render a checkbox "Show Part # on PDF" near the existing PDF-related options.
- `src/components/EditSaleDialog.tsx`: same checkbox, initialize from `sale.showSku !== false`, include in submit payload.

### PDF & preview
- `src/lib/invoiceGenerator.ts`: when `sale.showSku === false`, skip rendering the SKU header and SKU column cells, and shift the Qty/Price/Total columns left to fill the space (reuse quoteGenerator.ts logic as reference).
- `src/components/InvoicePreviewDialog.tsx`: wrap SKU `<th>` and `<td>` in `{sale.showSku !== false && …}`.

### Out of scope
- No changes to how SKU is stored on line items or to other documents (quotes, POs).
