

## Merge Grouped Requests into a Compact Summary Card

### What changes

**1. Compact grouped request card (`src/pages/Requests.tsx`)**

Replace the current stacked `RequestCard` rendering for grouped requests with a single compact card that shows:
- Request number header (e.g. REQ-0012)
- Requester name
- A simple table/list of items: Item Name | Qty | Unit Price | Line Total
- Group total at the bottom
- Status selector, bank card selector, and action buttons (edit/delete) at the group level
- Click on the card or a "View Details" button navigates to a new full-page detail view

**2. New full-page grouped request detail page (`src/pages/RequestDetail.tsx`)**

A dedicated page at route `/requests/:requestNumber` that:
- Fetches all requests sharing that `requestNumber`
- Displays each item as a row with full details (name, SKU, qty, unit price, GST, extra cost, line total)
- Shows image/PDF attachments per item
- Shows notes per item
- Displays the combined total for the entire request
- Allows editing individual items (navigate to existing edit page)
- Allows status changes and card assignment (for admins)

**3. Route registration (`src/App.tsx`)**

Add a new route: `/requests/view/:requestNumber` pointing to `RequestDetail`.

### Technical details

- The grouped card in `Requests.tsx` replaces the current `group.requests.length > 1` block with a single `Card` containing a mini table (div-based rows) showing item name, quantity, and total per line
- Single-item requests continue using `RequestCard` as-is
- The detail page reuses existing hooks (`useRequests`, `useBankCards`, `useLinkedRequester`) and filters by `requestNumber`
- Status/card changes on the detail page apply to all items in the group simultaneously
- Delete on the detail page deletes all items in the group (with confirmation)

### Files to create/modify
- **Create** `src/pages/RequestDetail.tsx` -- full-page view for a grouped request
- **Modify** `src/pages/Requests.tsx` -- compact summary card for grouped requests
- **Modify** `src/App.tsx` -- add route for detail page

