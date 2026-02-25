

## Solid Backgrounds for All Tables

### Problem
Tables across the app use semi-transparent backgrounds (e.g., `bg-muted/50`, `hover:bg-muted/50`) which can look washed out or inconsistent, especially on different background layers.

### Solution
Update the base table UI component and the InventoryTable to use solid background colors. This ensures every table in the app gets solid backgrounds automatically.

### Changes

**1. `src/components/ui/table.tsx`** (base component - affects all tables)
- `TableRow`: Change `hover:bg-muted/50` to `hover:bg-muted`
- `TableFooter`: Change `bg-muted/50` to `bg-muted`

**2. `src/components/InventoryTable.tsx`**
- Header `TableRow`: Change `bg-muted/50 hover:bg-muted/50` to `bg-muted hover:bg-muted`

These two file changes will give every table across the app (Inventory, Sales Orders, Jobs, Purchase History, Bank Card Details, Job Items, Sales, etc.) solid header/hover/footer backgrounds since they all use the shared `Table` component.

### Files to modify
- `src/components/ui/table.tsx`
- `src/components/InventoryTable.tsx`
