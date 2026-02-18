
## Allow Item Search When Adding Items to a Purchase Order

### What's Changing

There are two places where items are added to a PO:
1. **`AddPurchaseOrder.tsx`** — the full-page PO creation form (used via `/purchase-orders/new`)
2. **`AddPurchaseOrderDialog.tsx`** — the dialog used from the PO list page

Both need search-enabled item selection.

---

### Problem 1: AddPurchaseOrder.tsx (full page)

An `ItemSearchCombobox` already exists here with a `CommandInput` search box. However, `filteredInventoryItems` is defined as:

```js
const filteredInventoryItems = vendorId && vendorId !== 'none'
  ? inventoryItems.filter(item => vendorPrices.some(vp => vp.itemId === item.id))
  : [];
```

This means only items that have a vendor-specific price set will appear in the combobox. If a vendor is selected but an item has no vendor price, it is invisible — the combobox shows nothing to search.

**Fix**: Show all inventory items in the combobox regardless of vendor pricing. Vendor pricing is still applied automatically when a match exists — but all items become searchable and selectable.

```js
// Before:
const filteredInventoryItems = vendorId && vendorId !== 'none'
  ? inventoryItems.filter(item => vendorPrices.some(vp => vp.itemId === item.id))
  : [];

// After:
const filteredInventoryItems = vendorId && vendorId !== 'none'
  ? [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name))
  : [];
```

This keeps the vendor-price auto-fill logic intact (it still checks `vendorPrices` on select), but all items become visible and searchable.

---

### Problem 2: AddPurchaseOrderDialog.tsx (dialog)

The dialog uses a plain `<Select>` dropdown for item selection — no search. With many inventory items, this is unusable.

**Fix**: Replace the `<Select>` with the same `ItemSearchCombobox` pattern (Popover + Command + CommandInput) that the full page already uses. This adds a searchable combobox with:
- Type-to-filter by item name or SKU
- "Custom Item" option
- All inventory items listed (sorted A-Z), not restricted to vendor-priced ones
- Vendor price auto-applied when an item is selected and a match exists

---

### Files Changed

**`src/pages/AddPurchaseOrder.tsx`**
- Change `filteredInventoryItems` to include all inventory items (not just vendor-priced ones), still sorted A-Z
- Remove the hint text "Select a vendor to see available items with pricing" (since all items now show)

**`src/components/AddPurchaseOrderDialog.tsx`**
- Add imports: `Popover`, `PopoverContent`, `PopoverTrigger`, `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem`, `CommandGroup`, `ChevronsUpDown`, `Check`, `cn`
- Add an `ItemSearchCombobox` component at the top of the file
- Replace the `<Select>` item picker in each line item with the new `ItemSearchCombobox`
- Change `filteredInventoryItems` to include all inventory items sorted A-Z

---

### No Database Changes Required
