# Editable notes on sales order item detail

Make the notes on a sales order item detail page editable, and show them on the sales order page next to the item name.

## What changes

Item detail page (`/sales-orders/:id/items/:quoteItemId/:unitIndex`), Notes card:
- The "Original item note" block becomes an editable field for the item's own note, with its own Save button. Saving updates the quote item note, so it also appears on quote/sales order PDFs and in job descriptions. A short hint notes it applies to every unit of that item.
- The existing "Notes for this unit" field stays as-is (per-unit, saved on the item link row).

Sales order page (item/unit table):
- The "details" toggle under an item name now shows both notes for that row: the item note first, then the per-unit note labelled as unit-specific.
- The toggle appears when either note exists (today only the item note triggers it).
- Job creation description for a unit includes the per-unit note under the item note, so a job created from that unit carries the same text.

## Technical notes

- `src/pages/SalesOrderItemDetail.tsx`: add `itemNote` state initialized from `item.notes`, a save handler updating `quote_items.notes` for `quoteItemId`, then refetch quotes so other views pick it up (use the `refetch` from `useQuotes`).
- `src/pages/SalesOrderDetail.tsx`: fetch `unit_notes` in `fetchItemLinks` and add it to the `ItemLink` type; extend the notes rendering block at the item-name cell to render item note + unit note; update `buildJobDescription` to append the parent's unit note and each add-on's unit note.
- No database or RLS changes; `quote_items.notes` and `so_item_job_links.unit_notes` already exist.
