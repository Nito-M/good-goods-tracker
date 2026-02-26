
# Speeding Up the Items & Inventory Page

## Problem Analysis

The page is slow because of three issues:

1. **Thumbnails and tags fetch ALL item IDs, not just the current page.** The `InventoryTable` passes all `sortedItems` IDs (could be hundreds/thousands) to `useItemThumbnails` and `useBulkItemTags`, triggering dozens of batched database queries -- even though only 40 items are displayed per page.

2. **Redundant signed URL generation for thumbnails.** Every time the item list changes, ALL thumbnails are re-fetched and signed URLs regenerated for every item, not just the visible ones.

3. **Bulk location quantities also fetch for ALL items** in the parent `Items` component, regardless of pagination.

## Proposed Fix

Scope the bulk data hooks to only fetch data for the **current page's items** instead of all items.

### Changes

**`src/components/InventoryTable.tsx`**
- Change `useItemThumbnails` and `useBulkItemTags` to use `pagedItems` IDs (the 40 visible items) instead of all `sortedItems` IDs.
- This reduces queries from potentially 20+ batches down to 1 batch per hook.

```
// Before (line 48-50):
const itemIds = useMemo(() => sortedItems.map((item) => item.id), [sortedItems]);
const thumbnailMap = useItemThumbnails(itemIds);
const { getTagsForItem } = useBulkItemTags(itemIds);

// After:
const pagedItemIds = useMemo(() => pagedItems.map((item) => item.id), [pagedItems]);
const thumbnailMap = useItemThumbnails(pagedItemIds);
const { getTagsForItem } = useBulkItemTags(pagedItemIds);
```

**`src/pages/Items.tsx`**
- The `useBulkItemLocationQuantities` hook currently receives ALL item IDs. This is needed for warehouse filtering (to know which items exist in a warehouse), so it must remain as-is for correctness. However, this hook already uses batching and is a single lightweight query (no signed URLs), so the impact is minimal.

### Impact
- For a user with 200 items: reduces thumbnail queries from ~4 batches + 4 signed URL batches to 1+1. Tags queries drop from ~4 to 1.
- Page changes will re-fetch only the 40 visible items -- fast and focused.
- No changes to the database or backend needed.
