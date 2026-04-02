

## Plan: Drag-and-Drop Reordering for Quote and Invoice Cart Items

### Summary
Add drag-and-drop reordering to the cart item lists in both the Quotes and Sales (Invoice) creation forms using `@dnd-kit/core` and `@dnd-kit/sortable`.

### Dependencies
- Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`

### Changes

**`src/pages/Quotes.tsx`**
- Wrap the cart items list with `DndContext` and `SortableContext` (vertical list strategy)
- Extract each cart item card into a `SortableQuoteItem` wrapper that uses `useSortable` for drag handle, transform, and transition
- Add a grip/drag handle icon (GripVertical from lucide) to each item card
- On `onDragEnd`, reorder the `cart` array by moving the dragged item to its new position

**`src/pages/Sales.tsx`**
- Same pattern: wrap the cart table body with `DndContext` + `SortableContext`
- Make each `TableRow` sortable with a drag handle column
- On `onDragEnd`, reorder the `cart` array

### Technical Details
- Uses `arrayMove` from `@dnd-kit/sortable` for clean reorder logic
- `closestCenter` collision detection strategy
- Drag handle approach (not whole-card dragging) so inputs remain clickable
- No database changes needed -- order is determined by array position at save time

