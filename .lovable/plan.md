

## Plan: Show reserved quantities in Purchase & Sales History

**Problem**: When items are reserved in jobs, the "Remaining" column in the Purchase & Sales History card doesn't reflect reserved quantities. It only accounts for sold quantities (from `po_item_allocations`), not reserved ones.

**Solution**: Query `job_items` where `reserved = true` for the given SKU, sum up the total reserved quantity, and subtract it from the remaining calculation alongside sold quantities.

### Changes

**`src/components/ItemPurchaseHistory.tsx`**:

1. Add a new state/variable for total reserved quantity by fetching from `job_items` where `sku = sku` and `reserved = true`.

2. Add a "Reserved" summary stat in the stats grid (between "Total Sold" and "In Stock").

3. Update the remaining quantity calculation in the PO table to also subtract reserved quantities (distributed FIFO across POs, oldest received first — matching how `deductFromLocations` works).

4. Show a "Reserved" column or badge in the PO table so users can see how many units are reserved per PO.

**Approach for distributing reserved qty across POs**: After calculating sold quantities per PO, distribute the total reserved quantity across received POs in order (oldest first), deducting from each PO's remaining (after sold) until the reserved total is exhausted. This mirrors the FIFO approach used elsewhere.

**No database changes needed** — `job_items` already has `sku` and `reserved` columns.

