

## Make Item Name Clickable and Remove Eye Button

### Problem
Currently, users click a small eye icon button to navigate to item details. The item name is not clickable, and the eye button takes up space.

### Solution
Make the item name a clickable link that navigates to `/item/{id}`, and remove the eye icon button column entirely.

### Changes

**File: `src/components/InventoryTable.tsx`**

1. Remove the "Actions" table header column
2. Make the item name cell clickable with a cursor pointer and hover underline, navigating to `/item/{item.id}` on click
3. Remove the `Eye` icon import and the Actions `TableCell` with the eye button
4. Update the empty-state `colSpan` from 8 to 7

