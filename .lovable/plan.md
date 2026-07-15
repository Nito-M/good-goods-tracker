## Goal

On the SOP edit page, add a button in the Bill of Materials section that jumps straight to the "New Purchase Order" screen with every BOM part pre-loaded (part, quantity, and last known cost). The user just picks a vendor and saves.

## UX

- In the **Bill of Materials** card header on the SOP edit page, add a button **"Create PO from BOM"** next to the existing **Add Parts** button.
- Disabled when the BOM is empty.
- Clicking it opens the **New Purchase Order** page with:
  - All BOM parts already added as line items
  - Quantity = BOM quantity
  - Unit cost = the item's current cost (editable)
  - Notes on each line = BOM note (if any), plus a small tag like `From SOP: <title>`
  - Vendor field left blank so the user chooses
- Optional BOM items are included but flagged in the line-note as `(optional)` so the user can remove them.

## Technical notes

- Pass the prefill via `navigate('/purchase-orders/new', { state: { prefillItems: [...] } })` — matches the existing `useLocation` pattern in `AddPurchaseOrder.tsx`.
- In `AddPurchaseOrder.tsx`, read `location.state.prefillItems` on mount (only when not editing) and seed the items array.
- Prefill shape: `{ inventory_item_id, name, sku, quantity, unit_cost, notes }`.
- No schema changes. No new tables. No changes to PO save logic.

## Files touched

- `src/pages/SopEdit.tsx` — new button + navigate call, builds prefill from `bom` + `itemsById`.
- `src/pages/AddPurchaseOrder.tsx` — read `prefillItems` from `location.state` and seed initial items state.
