## Add toggle for "Link Request" section on PO creation

**File:** `src/pages/AddPurchaseOrder.tsx`

1. Add a `showLinkRequest` state, defaulting to `false`, persisted in `localStorage` (key: `po_show_link_request`) so each user's preference sticks across sessions.
2. Add a small inline toggle (Switch + label "Link to Request") near the top of the Create PO page, next to the vendor/header area.
3. Wrap the existing Link Request UI block in `{showLinkRequest && (...)}` so it only renders when the toggle is on.
4. When toggled off, clear any currently selected linked request so a hidden linkage isn't silently submitted.

No database or backend changes needed — this is a purely UI/preference toggle.