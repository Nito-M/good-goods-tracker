## Goal

Make each purchase order on the Purchase Orders page clickable to open a full detail page showing dates, items, attachments, and editable internal notes that never appear on the PDF.

## New page: `/purchase-orders/:id` (PurchaseOrderDetail)

Header
- PO number, vendor, status badges (Draft / Ordered / Partial / Received / Paid)
- Buttons: Back, Edit, Preview PDF, Download PDF

Timeline section
- Created date (always)
- Ordered date (`ordered_at`)
- Partially received date (when status moved to `partially_received`)
- Received date (`received_at`)
- Paid date (`paid_at`)

Vendor / company block
- Vendor name, contact person, company, bank card used
- Linked request (REQ-#) and linked jobs (JOB-#)

Items table (separate from PDF rendering)
- Part #, Item name, Qty ordered, Qty received, Unit cost, Line total
- Totals (subtotal, discount, total)

Attachments section
- All `po_attachments` (images + PDFs) listed with filename and open link

Two notes blocks
- "PO Notes (visible on PDF)" — existing `notes` field
- "Internal Notes (not on PDF)" — new field, autosave on blur

## Purchase Orders list change

- Make each `PurchaseOrderCard` body clickable to navigate to `/purchase-orders/:id`, with `stopPropagation` on existing action buttons (mirrors what was done on `SaleCard`).

## Database changes

Add to `public.purchase_orders`:
- `internal_notes text` — private notes, never sent to PDF
- `partially_received_at timestamptz` — set automatically when status transitions to `partially_received`

Existing `ordered_at`, `received_at`, `paid_at` already cover the rest of the timeline.

## Code changes

- `supabase/migrations/...` — add 2 columns
- `src/types/purchaseOrder.ts` — add `internalNotes`, `partiallyReceivedAt`
- `src/hooks/usePurchaseOrders.ts` — map new fields; stamp `partially_received_at` in `markAsPartiallyReceived`; add `updateInternalNotes`
- `src/pages/PurchaseOrderDetail.tsx` — new page (timeline, items, attachments, two notes blocks)
- `src/App.tsx` — add `/purchase-orders/:id` route
- `src/components/PurchaseOrderCard.tsx` — make card body clickable, stopPropagation on action buttons
- `src/lib/purchaseOrderGenerator.ts` — unchanged; only reads `order.notes`, never `internal_notes`

## Out of scope

- No change to PDF layout
- No change to PO creation/edit flow
