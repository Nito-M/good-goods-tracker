

## Sort Items A-Z and Add Search in PO Item Selection

### Problem
When adding items to a Purchase Order, the inventory items in the dropdown are unsorted and there's no way to search/filter them, making it hard to find items quickly.

### Changes in `src/pages/AddPurchaseOrder.tsx`

**1. Sort items alphabetically (A-Z)**

In the item selection dropdown (around line 434-446), sort `filteredInventoryItems` by name before rendering:

```tsx
filteredInventoryItems
  .filter(item => !lineItems.some(li => li.id !== lineItem.id && li.selectedItemId === item.id))
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(item => ...)
```

**2. Add search/filter capability to the item dropdown**

Replace the `Select` component for item selection with a searchable combobox pattern using the existing `Command` (cmdk) component wrapped in a `Popover`. This gives users a search input at the top of the dropdown to filter items by name or SKU.

- Import `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem`, `CommandGroup` from `@/components/ui/command`
- Import `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
- Replace each item `Select` with a Popover+Command combo that:
  - Shows a trigger button displaying the selected item name (or "Select item...")
  - Opens a popover with a search input and scrollable list
  - Filters items by name or SKU as the user types
  - Sorts results A-Z
  - Still excludes already-selected items and includes "Custom Item" option

### Also update `src/components/EditPurchaseOrderDialog.tsx`

Apply the same A-Z sorting to the item selection dropdown in the edit dialog for consistency. (The edit dialog likely uses a similar Select for items.)

### Technical Details
- Uses existing `cmdk` library already installed and the `Command` UI components already in the project
- No new dependencies needed
- The combobox pattern is the standard shadcn/ui approach for searchable selects

