

## Problem

The `ItemPurchaseHistory` component only recognizes two PO statuses: `'ordered'` and `'received'`. The `'partially_received'` status is completely unhandled, causing these POs to:

1. Not count toward "Total Purchased" (line 232 filters for `status === 'received'` only)
2. Not show sold quantities (line 96 checks `status === 'received'`)
3. Not get FIFO reserved distribution (line 110 checks `status !== 'received'`)
4. Show as "Ordered" badge instead of a partial badge (line 353)

## Plan

**Edit `src/components/ItemPurchaseHistory.tsx`:**

1. Update the `PurchaseHistoryItem` interface to include `'partially_received'` in the status union type
2. Treat `'partially_received'` the same as `'received'` throughout the component:
   - Line 96: `soldQuantity` should be set for both `received` and `partially_received`
   - Line 101: Cast should include `'partially_received'`
   - Lines 110-111: FIFO logic should include `partially_received`
   - Line 232: `totalPurchased` filter should include `partially_received`
   - Lines 326-357: Status badge rendering should handle `partially_received` (show a distinct "Partial Recv" badge)

The fix is straightforward - everywhere the code checks `status === 'received'`, it should also accept `'partially_received'`. A helper like `const isReceived = (s) => s === 'received' || s === 'partially_received'` will keep it clean.

