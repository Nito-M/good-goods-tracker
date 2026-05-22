## Goal
On the Sales Order page, in the Billing tab's **Invoices** card, surface paid vs. owing totals (with both dollar amount and percentage of the sales order total), and add a button to create an invoice for the remaining balance — mirroring the "To Invoice" button on the quote.

## Changes (file: `src/pages/SalesOrderDetail.tsx`)

1. **Wire up the invoice conversion hook**
   - Pull `convertToInvoice` from the existing `useQuotes()` call (already imported).
   - Add local state for a "Create Invoice for Remaining" dialog (open flag + percentage input), modeled on `QuoteCard.tsx`'s existing dialog.

2. **Enhance the Invoices card header / summary**
   At the top of the Invoices card content (above the per-invoice rows), add a summary block showing:
   - **Paid:** `$X.XX (YY%)` — sum of linked sales where `paidAt` is set, percentage = paid / quote.total.
   - **Owing:** `$X.XX (YY%)` — `quote.total - paid`, percentage = 100 - paid%.
   - Color: Paid green, Owing red when > 0 (using `text-emerald-600` / `text-destructive` semantic tokens already used elsewhere in the file).

3. **Add "Invoice Remaining" button**
   - Show next to the Invoices card title (or in the summary block) when `quote.invoicedPercentage < 100`.
   - Label: `Invoice Remaining (NN%)` where NN = `100 - quote.invoicedPercentage`.
   - Clicking opens a dialog (copied pattern from `QuoteCard.tsx` lines 411–449):
     - Numeric input pre-filled with remaining %, capped at remaining %.
     - Shows preview: `Invoice total: $X.XX`.
     - Confirm calls `convertToInvoice(quote, percentage)`; the hook updates `quote.invoicedPercentage` and creates the linked sale, which will refresh into the existing list.

## Notes
- "Paid %" intentionally uses paid dollars over quote total (not `invoicedPercentage`), so partially-paid invoices are reflected accurately. If you'd prefer the percentage to mean "% of the sales order that has been invoiced (regardless of payment)", say the word and I'll swap it.
- No backend/schema changes. Reuses the existing `convertToInvoice` flow from `useQuotes`.
