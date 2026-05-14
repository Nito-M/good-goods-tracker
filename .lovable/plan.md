## Goal

Make each invoice on the Sales page clickable to open a full detail page showing dates, items, and editable internal notes that never appear on the PDF.

## New page: `/sales/:id` (SaleDetail)

Header
- Invoice number, status badges (Picked Up / Paid / etc.)
- Buttons: Back, Edit, Preview PDF, Download PDF

Timeline section
- Created date (always)
- Sent date (when status moved to `sent`)
- Picked-up date (existing `picked_up_at`)
- Paid date (when status moved to `paid`)
- Due date

Customer / billing block
- Vendor name, contact, address, payment terms

Items table (separate from PDF rendering)
- Name, Part #, Qty, Unit price, Total
- Cost / Profit columns when picked up
- Totals (subtotal, discount, tax, total)

Two notes blocks
- "Invoice Notes (visible on PDF)" — existing `notes` field
- "Internal Notes (not on PDF)" — new field, autosave on blur

## Sales list change

- Wrap each `SaleCard` in a `Link to={/sales/${sale.id}}`, or make the card body clickable while keeping action buttons working (stop propagation on buttons).

## Database changes

Add to `public.sales`:
- `internal_notes text` — private notes, never sent to PDF
- `sent_at timestamptz` — set automatically when status transitions to `sent`
- `paid_at timestamptz` — set automatically when status transitions to `paid`

Backfill: leave NULL for old rows; UI shows "—" when missing.

The existing status-change handler in `useSales` will be updated to stamp `sent_at` / `paid_at` on transition (and clear them on revert).

## Code changes

- `supabase/migrations/...` — add 3 columns
- `src/types/sale.ts` — add `internalNotes`, `sentAt`, `paidAt`
- `src/hooks/useSales.ts` — map new fields; stamp timestamps on status change; add `updateInternalNotes`
- `src/pages/SaleDetail.tsx` — new page (timeline, items, two notes blocks)
- `src/App.tsx` — add `/sales/:id` route
- `src/components/SaleCard.tsx` — make card clickable (Link wrapper around header/content, stop propagation on action buttons)
- `src/lib/invoiceGenerator.ts` — unchanged; confirm it only reads `sale.notes`, never `internal_notes`

## Out of scope

- No change to PDF layout
- No change to invoice creation flow
