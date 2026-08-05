# Carry the part number onto new vendor entries when receiving a PO

## What happens today

When a purchase order is received, each line's cost is saved back to the item's vendor list. If the item didn't already have that PO's vendor attached, a brand-new vendor entry is created with just the price — the vendor's part number field is left blank.

## What will change

When receiving a PO creates a new vendor entry on an item, the PO line's part number is copied into that vendor entry's part number field, so it shows up in the item's Vendors section right away.

Details:
- New vendor entry: price + part number from the PO line.
- Existing vendor entry: price updates as it does now, and the part number is filled in only if it's currently empty (never overwrite a part number you already set by hand).
- If the PO line has no part number, nothing extra is written.

## Technical notes

- `updateVendorPriceFromPO` in `src/hooks/useItemVendorPrices.ts` gains an optional `vendorSku` argument; it writes `vendor_sku` on insert and, on update, only when the existing row's `vendor_sku` is null/empty.
- The receive flow in `src/hooks/usePurchaseOrders.ts` (~line 528) passes `item.sku` through.
- No database changes needed — `item_vendor_prices.vendor_sku` already exists.
