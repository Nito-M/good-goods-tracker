## Plan — Post-tax adjustment lines on invoices

Add a section in the invoice editor to create multiple labeled adjustment lines (each with a label and a +/- amount). They appear below the GST line on the invoice preview and PDF, and are applied to the final Total.

### What you'll see
- In the invoice edit screen (`EditSaleDialog`), a new "Adjustments (after tax)" section below the tax field — add row, label, amount (can be negative), delete row.
- In the invoice preview (`InvoicePreviewDialog`) and the generated PDF (`invoiceGenerator`), each adjustment appears as its own line under "Tax (GST)" and above the final "TOTAL".
- Final Total = Subtotal − pre-tax discount + Tax + Σ adjustments.

### Where the data lives
- New database table `sale_adjustments` linked to a sale: `label`, `amount` (NUMERIC, can be negative), `sort_order`. RLS mirrors `sales` (owner + org members can read/write).
- `sales.total` continues to be the authoritative final total (recomputed when adjustments change).
- Loaded/saved alongside sale items in `useSales`.

### Where it shows up
- `EditSaleDialog`: new adjustments editor.
- `InvoicePreviewDialog`: render adjustments between Tax and Total.
- `invoiceGenerator` (PDF): same order.
- `SaleDetail`: include adjustments in the summary block.

### Technical notes
- Adjustments are post-tax only (do not affect taxable subtotal or item profit).
- Amount stored as NUMERIC(12,2), step 0.01 in inputs; allow negatives.
- Backward compatible: sales with no adjustments behave exactly as today.
- Migration creates the table, RLS policies (owner + `users_share_org`), and an `updated_at` trigger.