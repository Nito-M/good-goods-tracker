## Add Invoices to Vendor Detail page

Mirror the existing "Recent Purchase Orders" section on `src/pages/VendorDetail.tsx` with a new "Recent Invoices" section for sales tied to this vendor.

### Changes

**`src/pages/VendorDetail.tsx`**
- Import `useSales` from `@/hooks/useSales`.
- Filter sales where `sale.vendorId === vendor.id` (vendor = customer in sales context).
- Add a "Recent Invoices" card below "Recent Purchase Orders", showing up to 10 most recent invoices:
  - Invoice number (linked to `/sales/:id`)
  - Date (`createdAt` or `pickedUpAt`)
  - Total amount
  - Status badge (draft/sent/picked_up/paid/overdue/cancelled)
- Add an "Invoices" row in the Summary card showing the count and total invoiced amount.

### Notes
- Read-only display, no schema or business-logic changes.
- Follows the same card/list pattern already used for POs to keep styling consistent.
