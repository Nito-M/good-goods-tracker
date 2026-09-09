# Rearrangeable SOP Cards

Let the main sections inside an SOP (Details, Procedure Steps, Bill of Materials, Locations / Links, Notes, Attachments) be dragged into any order. Each SOP remembers its own arrangement, and the order is shared so everyone on the team sees the same layout.

## What changes

- A small drag handle appears in the top-left of each section heading. Drag a section up or down to move it.
- The new order saves automatically as soon as you drop a section.
- Opening the SOP later — on any device, for any teammate — shows the saved order.
- The Delete SOP box stays pinned at the bottom and cannot be moved.
- Procedure steps keep their existing drag-to-reorder behaviour inside their own card.

## Technical notes

- Add a `card_order text[]` column to `public.sops` (nullable). Existing rows fall back to the default order.
- In `src/hooks/useSopDetail.ts`: read `card_order` with the SOP, expose `cardOrder` plus a `setCardOrder(ids)` that updates state optimistically and persists to the row.
- In `src/pages/SopEdit.tsx`: extract the six section cards into a keyed map (`details`, `steps`, `bom`, `locations`, `notes`, `attachments`), render them in `cardOrder` order (unknown/missing keys appended in default order), and wrap the list in a second `@dnd-kit` `DndContext` + `SortableContext` (vertical strategy) separate from the existing steps context.
- Each card gets a `useSortable` wrapper with a `GripVertical` handle in its header; only the handle gets drag listeners so inputs inside stay usable.
