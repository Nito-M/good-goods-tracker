# Match invoice notes to the sales order, line by line

Today the sales order PDF prints one row per trailer/unit (quantity 1 each) with that unit's own note underneath. When those items are invoiced, the units get merged back into a single line whose note becomes a block of `Unit 1: ...` / `Unit 2: ...` text, so the invoice reads differently from the sales order.

## What changes

1. **One invoice line per unit.** Invoicing a line with a whole quantity greater than 1 creates that many invoice rows, each with quantity 1 and only that unit's note — exactly the rows the sales order PDF shows. Fractional quantities (e.g. 2.5 m) stay as one line.
2. **Notes copied verbatim.** Each row carries the unit's note text as entered on the unit detail page; if a unit has no note, the item's shared note is used, same as the sales order. No `Unit N:` relabelling.
3. **Add-ons stay with their unit.** An add-on attached to unit 2 is inserted directly after that unit's row, with its own note.
4. **Invoice PDF note prefix.** The `Note:` label is applied once per note block, and multi-line note text wraps and paginates under the item name as it already does.
5. **Dialog preview.** The "Invoice Selected Items" dialog previews the per-unit lines it will create (unit rows with their notes and add-ons) instead of a merged `Unit N:` block.

Invoiced-quantity tracking, totals, tax (5% GST default) and the percentage-of-quote calculation are unchanged — the same quantity is invoiced, only spread across rows.

## Technical notes

- `convertItemsToInvoice` in `src/hooks/useQuotes.ts`: replace the single-row-per-selection build with a per-unit expansion mirroring `handleDownloadSalesOrder` in `src/pages/SalesOrderDetail.tsx` (whole qty > 1 -> `qty` rows of 1, note from `so_item_job_links.unit_notes[unitIndex]`, fallback `quote_items.notes`); attach add-ons per parent unit index instead of per line; keep `invoiced_quantity` increments summed per `quote_items.id`.
- `src/lib/unitNotes.ts`: add a single-unit resolver used by both the invoice conversion and the dialog; keep `composeUnitNotes` for callers that still need the merged form.
- `src/lib/invoiceGenerator.ts`: keep the `Note:` prefix on the first line only when splitting multi-line note text.
- `src/components/quote/ConvertItemsDialog.tsx`: render per-unit preview rows.
- No database or RLS changes.
