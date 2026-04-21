

## Use Vendor SKU on Purchase Orders

When a vendor is selected on a PO, swap the inventory item's primary SKU for that vendor's SKU (from `item_vendor_prices.vendor_sku`) on each line item — and also use the vendor's price (already done). The internal item name and link to the inventory item stay the same; only what's printed/saved in the PO line `sku` changes.

### Behavior

1. **No vendor selected** → use the item's primary SKU (current behavior, unchanged).
2. **Vendor selected, vendor has one price row for that item with a `vendor_sku`** → auto-fill that vendor SKU on the PO line.
3. **Vendor selected, no `vendor_sku` set on the row** → fall back to the item's primary SKU.
4. **Vendor has multiple price rows for that item** (now possible after the recent change) → use the row whose price was applied to the line. If the chosen row has no `vendor_sku`, fall back to primary SKU.
5. **Changing the vendor on an existing PO** → recompute the SKU for every cart line that links to an inventory item, the same way unit cost is already recomputed.
6. **Editing the SKU manually** → the user can still type over the SKU field on a custom line; for inventory-linked lines the SKU continues to be read-only (no change to that UX).

### Where the change lives

- `src/pages/AddPurchaseOrder.tsx`
  - Extend the vendor-prices fetch to also pull `vendor_sku` (and the row `id`, so we can match the specific row used for the price).
  - Update `handleAddItem` to set `sku` to `vendor_sku ?? item.sku`.
  - Update `handleVendorChange` to update both `unitPrice/unitCost` and `sku` on existing inventory-linked cart lines.
  - When a vendor is cleared (set to "none"), restore each inventory-linked line's `sku` back to the item's primary SKU.

### Out of scope

- The PO PDF, edit dialog, and storage schema already accept any string in the line `sku` field, so no DB or PDF changes are needed.
- Item Details, Add Item, and Vendor Pricing UI are unchanged — vendor SKUs are still entered there.
- Receiving stock still matches against the inventory item via `inventoryItemId` (not the SKU string), so receipt flow is unaffected.

