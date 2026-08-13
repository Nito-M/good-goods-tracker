# Make unit notes per-unit only

Right now the notes field on the unit detail page saves to the shared item note, so every unit of that item shows the same text. This changes it so saving affects only the unit you edited, while still showing up on the sales order page and the PDF.

## What changes

Unit detail page (`/sales-orders/:id/items/:quoteItemId/:unitIndex`):
- One Notes editor, saved to that unit only. It is pre-filled with the item's existing note text the first time (so nothing is lost), and saving writes it to the unit's own record — other units are untouched.
- The separate "Item note" editor that applied to all units is removed to avoid confusion.

Sales order page:
- The "details" toggle next to an item shows that row's own note (unit note if present, otherwise the original item note). No more duplicate text across units.
- Job creation from a unit keeps using that unit's note.

Sales order PDF:
- Unit notes are included under the matching item line. When an item has more than one unit and the notes differ, each note is printed on its own line prefixed with the unit number; when all units share the same text, it prints once.

## Technical notes

- `src/pages/SalesOrderItemDetail.tsx`: drop the `itemNote` state, `handleSaveItemNote`, and its Textarea; initialize `unitNotes` from `link.unit_notes ?? item.notes ?? ''` so first-time editing starts from the existing item note. Saving continues via `upsertLink({ unit_notes })`.
- `src/pages/SalesOrderDetail.tsx`: in the item-name cell, render `link?.unitNotes ?? item.notes` as a single note block; keep the toggle condition on that resolved value. `buildJobDescription` uses the same resolved note per row instead of stacking item + unit note.
- `src/lib/quoteGenerator.ts`: accept an optional `unitNotes?: Record<string, string[]>` (keyed by quote item id) in the options; when present for a line item, replace/extend the existing `Note: …` block with the per-unit lines (`Unit 1: …`) and include them in the row-height calculation that already exists for `noteLines`.
- `src/pages/SalesOrderDetail.tsx` passes that map (built from `itemLinks`) into `generateQuotePDF`.
- No database changes: `so_item_job_links.unit_notes` and `quote_items.notes` already exist.
