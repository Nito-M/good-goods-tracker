

## Exclude Reserved Items from Total Quantity in All Job Items

### Problem
When items are reserved in a job, their quantity is already deducted from inventory stock. However, the "All Job Items" page still counts reserved items in the "Total Qty" column. This double-counts: stock is reduced AND the item is still listed as needed.

### Fix in `src/pages/AllJobItems.tsx`

**In the `aggregatedItems` aggregation logic (lines 56-70):** Only add non-reserved item quantities to `totalQty`. Reserved items should be skipped from the quantity sum since they've already been pulled from stock.

```tsx
// Current: always adds quantity
existing.totalQty += item.quantity;

// Fixed: only add if not reserved
if (!item.reserved) {
  existing.totalQty += item.quantity;
}

// And for new entries:
map.set(key, { ..., totalQty: item.reserved ? 0 : item.quantity, ... });
```

Reserved items will still appear in the jobs list for the expanded detail row, but their quantities won't inflate the "Total Qty" or "Need" calculations. The job label is still collected regardless of reserved status so users can see which jobs reference the item.

