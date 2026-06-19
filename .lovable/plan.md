## Allow negative quantity & unit cost in Purchase Orders

Remove the `min` constraints on number inputs so users can enter negative values for returns/credits.

### Files to update

1. **`src/components/AddPurchaseOrderDialog.tsx`** — remove `min={0.01}` on quantity, `min={0}` on unit cost. Drop the `quantity >= 1` rule in `isLineItemValid` (allow any non-zero number, but accept negatives).
2. **`src/components/EditPurchaseOrderDialog.tsx`** — same: remove `min` on quantity/unit cost inputs and any received-quantity `min={0}` if blocking returns.
3. **`src/pages/AddPurchaseOrder.tsx`** — remove `min={0}` on the three number inputs (quantity, unit cost, received qty as applicable).

### Behavior

- Quantity and unit cost accept negative values; totals (qty × cost) compute naturally — a negative qty with positive cost yields a negative line total, so the PO total reflects a credit/return.
- No DB schema changes needed (no CHECK constraints on these columns).
- No changes to receive flow, bank deductions, or inventory logic — those already use the stored numbers.

### Note
Inventory adjustments on receive will subtract instead of add when quantity is negative. If you want the receive step to skip stock changes for negative lines, say so and I'll add that branch.