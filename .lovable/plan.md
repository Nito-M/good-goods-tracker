

## Add Item Thumbnails to Job Views

### What Changes
Show inventory item thumbnail images in the job items tables -- both on the Job Detail page and the Add Items to Job page -- matching the pattern already used in the main Inventory Table.

### Files to Update

**1. `src/pages/Jobs.tsx`** (JobDetail component, ~lines 272-365)
- Import `useItemThumbnails`, `ImageViewerDialog`, and `ImageIcon`
- Collect `inventoryItemId`s from job items and pass to `useItemThumbnails`
- Add an image column header to the job items table
- Add a thumbnail cell before the Item name, showing the primary image (or a placeholder icon)
- Add `ImageViewerDialog` for full-size viewing on click
- Update the empty-state `colSpan` from 6 to 7

**2. `src/pages/JobAddItems.tsx`** (~lines 108-140)
- Import `useItemThumbnails`, `ImageViewerDialog`, and `ImageIcon`
- Collect inventory item IDs and pass to `useItemThumbnails`
- Add an image column header to the table
- Add a thumbnail cell before the Item name for each row
- Add `ImageViewerDialog` for full-size viewing on click
- Update the empty-state `colSpan` from 5 to 6

### Pattern
Follows the exact same thumbnail pattern from `InventoryTable.tsx`:
- 48px thumbnails with `object-contain`
- Placeholder icon when no image exists
- Click to open full-size image viewer dialog
- Uses `useItemThumbnails` hook to batch-fetch primary images

