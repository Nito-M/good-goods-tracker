

## Plan: Partial Invoice Conversion from Quotes

### Summary
Allow converting a single quote into multiple invoices by specifying a percentage of the quote total. Instead of marking the quote as "converted" after one invoice, track how much has been invoiced so far and allow additional conversions until 100% is reached.

### Database Changes

**`quotes` table**:
- Add `invoiced_percentage NUMERIC NOT NULL DEFAULT 0` — tracks cumulative % already invoiced
- Change `converted_to_invoice_id` from a single UUID to a new **`quote_invoices`** linking table (or simpler: just stop using it as the sole link and track multiple)

**New table `quote_invoice_links`**:
- `id UUID PRIMARY KEY`
- `quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE`
- `sale_id UUID REFERENCES sales(id) ON DELETE CASCADE`
- `percentage NUMERIC NOT NULL` — the % of the quote this invoice represents
- `created_at TIMESTAMPTZ DEFAULT now()`

This replaces the single `converted_to_invoice_id` field for tracking linked invoices.

### Code Changes

**`src/hooks/useQuotes.ts`** — `convertToInvoice`:
- Accept a `percentage` parameter (e.g. 25, 50, 75, 100)
- Multiply all item quantities and totals by `percentage / 100`
- Insert into `quote_invoice_links` instead of updating `converted_to_invoice_id`
- Update `invoiced_percentage` on the quote (add the new percentage)
- Only set quote status to `converted` when invoiced_percentage reaches 100%
- Otherwise keep current status so the "Convert to Invoice" button stays available

**`src/hooks/useQuotes.ts`** — `fetchQuotes`:
- Fetch linked invoices from `quote_invoice_links` to show invoiced percentage and linked invoice numbers

**`src/components/QuoteCard.tsx`**:
- Replace the current "Convert to Invoice" confirmation dialog with one that includes a percentage input (number field, default 100%)
- Show remaining percentage available (e.g. "75% remaining")
- Display all linked invoices (not just one) with their percentage and invoice number
- Keep "Convert to Invoice" button visible as long as invoiced_percentage < 100

**`src/types/quote.ts`**:
- Add `invoicedPercentage: number` to the `Quote` interface
- Add `linkedInvoices: { saleId: string; percentage: number; invoiceNumber?: string }[]`

### Technical Details
- Percentage input validated: min 1, max remaining %. Shows error if exceeding remainder
- Line items on the generated invoice have quantities scaled by the percentage fraction
- The invoice notes auto-include "X% of Quote QUO-XXXX"
- Existing single-invoice quotes remain compatible (they'll have 0% tracked, and `converted` status means 100%)

