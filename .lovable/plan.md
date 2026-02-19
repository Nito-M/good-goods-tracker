
## Filter Inventory Items to Vendor-Linked Items Only

### Problem
When a vendor is selected on the Create Purchase Order page, the item dropdown (`ItemSearchCombobox`) currently shows **all inventory items** (just sorted A-Z). The request is to only show items that have a vendor price entry linked to the selected vendor — plus always keeping the "Custom Item" option available.

### How it Works Today
In `src/pages/AddPurchaseOrder.tsx`:
- `vendorPrices` state is populated by fetching `item_vendor_prices` rows filtered by `vendor_id` — this gives back `{ itemId, price }` pairs.
- `filteredInventoryItems` is computed as all items sorted A-Z when a vendor is selected.
- The `vendorPrices` data is only used to auto-fill `unitCost` when an item is selected — it is **not** used to restrict the item list.

### The Fix
The change is a single-line update to `filteredInventoryItems` in `src/pages/AddPurchaseOrder.tsx`:

**Current:**
```ts
const filteredInventoryItems = vendorId && vendorId !== 'none'
  ? [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name))
  : [];
```

**Updated:**
```ts
const filteredInventoryItems = vendorId && vendorId !== 'none'
  ? [...inventoryItems]
      .filter(item => vendorPrices.some(vp => vp.itemId === item.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  : [];
```

This filters the inventory list to only items that exist in `vendorPrices` (i.e., have a price entry for the selected vendor). The "Custom Item" option is always shown in the combobox regardless, so users can still enter custom items freely.

### Edge Case: No Vendor Items Configured
If a vendor has no items assigned in the vendor pricing table, the inventory list will be empty and only "Custom Item" will appear. This is correct behavior — it tells the user no items have been set up for this vendor yet.

### Technical Details
- File to change: `src/pages/AddPurchaseOrder.tsx` — line 234-236
- No database changes needed
- No new dependencies required
- The `vendorPrices` state is already correctly populated when the vendor changes, so the filter will be reactive and update automatically when a vendor is selected or changed
