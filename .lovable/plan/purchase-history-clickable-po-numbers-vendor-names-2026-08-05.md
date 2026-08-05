# Purchase History: clickable PO numbers + vendor names

Both is better — the vendor name tells you who supplied it at a glance, and the link gets you to the PO in one click.

## What changes

In the item detail page's **Purchase & Sales History → Purchase Orders** table:

- **PO Number** becomes a link to that purchase order's detail page (opens in the same tab, styled as a primary-colored link, still shows "N/A" when a PO has no number).
- New **Vendor** column right after PO Number, showing the vendor's name (em dash when the PO has no vendor).
- In the **Sales** section, the existing PO badge also becomes clickable to the same PO.

## Technical notes

- `src/components/ItemPurchaseHistory.tsx`:
  - Extend the purchase orders query to select `vendor_id`, then batch-fetch matching rows from `vendors` (`id, name`) in one query and map id → name (no N+1).
  - Add `vendorName: string | null` to `PurchaseHistoryItem`, and carry the PO id through the sold-items map so the Sales badge can link too.
  - Render PO cells with react-router `Link` to `/purchase-orders/<id>` (route confirmed from existing PO detail page usage); keep table column widths balanced with the added column.
