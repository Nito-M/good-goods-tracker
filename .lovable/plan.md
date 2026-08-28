# Carry item details onto invoices created from quotes / sales orders

Today, invoicing selected items copies only the item name, SKU, quantity, price and the plain line note. The per-unit spec notes entered on the unit detail page, and any add-ons attached to a unit, do not follow the item, so the invoice PDF looks thinner than the sales order PDF.

## What changes

1. **Per-unit notes travel with the item.**
   When a line is invoiced, its note text is rebuilt the same way the sales order PDF does it:
   - all units share the same note (or only one unit exists) -> single note line;
   - units differ -> `Unit 1: ...`, `Unit 2: ...` lines under the item.
   The line stays as one invoice row with the full quantity (no splitting).

2. **Attached add-ons come along.**
   Any items attached as add-ons to the invoiced units are also added to the new invoice, right after their parent line, keeping their own notes, price and quantity. Their invoiced quantity is tracked too, so they can't be invoiced twice.

3. **Invoice dialog reflects it.**
   In the "Invoice Selected Items" dialog, a line that has add-ons shows them listed beneath it with a note that they will be included, and the invoice total preview includes their value.

4. **Invoice PDF renders the note block.**
   Multi-line notes (including `Unit N:` lines) wrap and paginate under the item name, exactly as on the sales order PDF.

## Technical notes

- `convertItemsToInvoice` in `src/hooks/useQuotes.ts`:
  - fetch `so_item_job_links` (`unit_notes`) and `so_item_attachments` for the quote;
  - compose the note string per line with the same rules as `buildNoteText` in `src/lib/quoteGenerator.ts` (extract that helper into a shared module so both PDF and invoice use one implementation);
  - expand the selection with attached child units (parent unit index range derived from the invoiced quantity), inserting them after the parent with `sort_order` preserved;
  - write the composed note into `sale_items.notes`; bump `invoiced_quantity` on both parent and pulled-in child `quote_items`, and include the children in the percentage calculation.
- `src/components/quote/ConvertItemsDialog.tsx`: accept optional unit-note / attachment maps, show add-on sub-rows, include them in the total.
- `src/pages/SalesOrderDetail.tsx` and `src/pages/Quotes.tsx`: pass the already-loaded links/attachments into the dialog (Quotes page fetches them on demand for the selected quote).
- `src/lib/invoiceGenerator.ts`: notes already flow via `flowLines`; confirm multi-line note blocks keep the italic grey styling and page-break correctly.

No database schema change is required.
