

## Plan: Separate "Accepted" and "Convert to Sales Order" Statuses

### Summary
Add a new `sales_order` status to quotes. The status dropdown will have two distinct options:
- **Accepted** — marks the quote as accepted (does not appear on Sales Orders page)
- **Convert to Sales Order** — sets status to `sales_order` and makes it appear on the Sales Orders page

### Database Changes
- Add `'sales_order'` to the `quote_status` enum (or update the check constraint on the `quotes.status` column)

### Code Changes

**`src/types/quote.ts`**
- Add `'sales_order'` to the `QuoteStatus` type union

**`src/components/QuoteCard.tsx`**
- In the Status dropdown, rename the current "Accepted" item to "Convert to Sales Order" and have it set status to `'sales_order'`
- Add a new "Accepted" dropdown item that sets status to `'accepted'`
- Add a badge style for `sales_order` status

**`src/pages/SalesOrders.tsx`**
- Change the filter from `q.status === 'accepted'` to `q.status === 'sales_order'` so only explicitly converted quotes appear there

### Technical Details
- Migration: `ALTER TYPE quote_status ADD VALUE 'sales_order';` (or equivalent depending on how the column is constrained)
- Existing quotes with `accepted` status will remain as `accepted` and won't appear in Sales Orders unless manually changed

