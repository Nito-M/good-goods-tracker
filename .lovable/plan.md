

## Link Invoice and Quote Layouts

### What You Want
Right now, each company has two separate layout editors — one for invoices and one for quotes. You want a single shared layout so that when you position elements (logo, business info, items table, etc.) for one document type, the same positions apply to the other.

### What Will Change

**1. Company Detail Page (`src/pages/CompanyDetail.tsx`)**
- Remove the separate `quoteLayout` state — use `invoiceLayout` as the single shared layout
- When saving quote settings, also save the shared layout
- Show only one layout editor (in the Invoice Settings section), with a note that it applies to both invoices and quotes
- Remove the layout editor from the Quote Settings section

**2. Save Logic**
- When saving invoice settings, save the layout to both `invoiceLayout` and `quoteLayout` fields so the database stays in sync
- When saving quote settings, also sync the layout from the shared state

**3. Fix Crash-Safe Layout Merging (4 files)**
Apply the `{ ...defaultInvoiceLayout, ...(layout || {}) }` spread pattern consistently in:
- `src/components/InvoicePreviewDialog.tsx` (line 27)
- `src/lib/invoiceGenerator.ts` (line 12)
- `src/lib/quoteGenerator.ts` (line 8)

These currently use `settings.layout || defaultInvoiceLayout` which crashes if the layout object exists but is missing some keys.

### Files to Modify
- `src/pages/CompanyDetail.tsx` — unify layout state, single editor, sync both fields on save
- `src/components/InvoicePreviewDialog.tsx` — safe layout merge
- `src/lib/invoiceGenerator.ts` — safe layout merge
- `src/lib/quoteGenerator.ts` — safe layout merge
