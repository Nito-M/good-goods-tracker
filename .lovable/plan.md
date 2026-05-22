## Changes

### 1. Show post-tax adjustments in Sales history cards

In `src/components/SaleCard.tsx`, inside the Totals block (between the Tax row and the Total row), render each entry from `sale.adjustments` the same way `SaleDetail.tsx` already does:

- Label: `adj.label` (fallback `Adjustment N`)
- Amount: signed currency, muted styling when negative
- Skip rendering if `sale.adjustments` is empty/undefined

This matches the existing pattern in `SaleDetail.tsx` so the history card mirrors the invoice detail page.

### 2. Make the Edit button in Sale Detail behave like the one in Sales history

Currently:
- Sales history (`SaleCard` → `handleEditSale` in `Sales.tsx`) loads the sale back into the full "New Sale" form (cart, vendor, tax, discount, adjustments, notes, etc.) so the entire invoice can be edited.
- Sale Detail (`SaleDetail.tsx`) opens the smaller `EditSaleDialog`, which only edits a limited set of fields.

Change `SaleDetail.tsx` so its Edit button instead navigates to `/sales` and triggers the same `handleEditSale` flow:

- Replace the `EditSaleDialog` trigger with `navigate('/sales', { state: { editSaleId: sale.id } })`.
- In `Sales.tsx`, read `location.state.editSaleId` on mount; when present and the matching sale is loaded, call `handleEditSale(sale)` and clear the state (`navigate(..., { replace: true, state: {} })`) so it doesn't re-trigger on refresh.
- Remove the now-unused `EditSaleDialog` import/usage and `editOpen` state from `SaleDetail.tsx`.

No backend, schema, or business-logic changes.

## Files touched

- `src/components/SaleCard.tsx` — render adjustments rows
- `src/pages/SaleDetail.tsx` — Edit button navigates to Sales edit flow; drop EditSaleDialog
- `src/pages/Sales.tsx` — pick up `editSaleId` from router state and invoke `handleEditSale`