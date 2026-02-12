

## Show Full Image in Inventory Table Thumbnails

### Problem
The current thumbnails use `object-cover`, which crops images to fill the 40x40px square. Users want to see the entire image.

### Solution
Change the image CSS from `object-cover` to `object-contain` in `src/components/InventoryTable.tsx`. This will fit the full image within the 40x40px thumbnail area without cropping, while keeping the same row height.

### Change
**File: `src/components/InventoryTable.tsx`** (line 66)
- Change `className="w-10 h-10 object-cover rounded-md border border-border"` to `className="w-10 h-10 object-contain rounded-md border border-border"`

One-line CSS change -- no other files affected.

