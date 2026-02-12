

## Show Item Thumbnails on Inventory Page

### Problem
The inventory table checks `item.imageUrl` for thumbnails, but images are stored in the `item_images` table (multi-image system). These two systems are disconnected, so thumbnails never appear.

### Solution
Batch-fetch primary images from `item_images` for all visible items and display them in the inventory table.

### Changes

**1. Create a new hook: `src/hooks/useItemThumbnails.ts`**
- Accepts an array of item IDs
- Queries `item_images` table for all primary images (`is_primary = true`) for those IDs in a single query
- Returns a `Map<itemId, imageUrl>` for quick lookup
- Refreshes when the item list changes

**2. Update `src/components/InventoryTable.tsx`**
- Import and call `useItemThumbnails` with the list of item IDs
- Replace `item.imageUrl` lookup with the thumbnail map
- Fall back to `item.imageUrl` if no entry exists in `item_images`

### Technical Details

```
InventoryTable
  --> useItemThumbnails(itemIds)
      --> SELECT image_url, item_id FROM item_images WHERE item_id IN (...) AND is_primary = true
      --> Returns Map<string, string>
  --> For each row: thumbnailMap.get(item.id) || item.imageUrl || placeholder icon
```

This approach avoids N+1 queries by fetching all thumbnails in one batch query. No database changes are needed.
