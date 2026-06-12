# Fix Duplicate Vendor Prices on Double Save

## Root Cause

On the Edit Item page, a newly added vendor price row gets a temporary id (`new-...`). When you press **Save Vendor Prices**, the row is inserted into the database — but the on-screen list is never refreshed, so the row keeps its temporary `new-` id. When you then press the main **Save** at the top, the page sees that `new-` id again, thinks it's still unsaved, and inserts it a second time → duplicate.

## Fix

**1. Re-sync after "Save Vendor Prices"** (`src/pages/AddItem.tsx`)
- After the vendor-price save completes, refetch the saved rows from the database and rebuild the on-screen list from them (real ids, `isNew: false`).
- This means the main Save afterwards sees them as existing rows and only updates them — no re-insert.

**2. Make the main Save use the same logic safely**
- The main Save and "Save Vendor Prices" share duplicated code; extract one shared save function so both paths behave identically and stay in sync.

**3. Clean up the duplicates you already have**
- Run a one-time data cleanup that finds vendor-price rows on the same item with identical vendor, price, SKU, link, and lead time, and keeps only the oldest one of each pair.

## Technical Details

- `handleSaveVendorPrices` will call the hook's `refetch()` and then `setVendorPrices` from the fresh `existingPrices`, replacing temp ids with database ids.
- Duplicate cleanup uses a `DELETE` keeping `MIN(created_at)` per (item_id, vendor_id, price, vendor_sku, link, lead_time_days) group — done via the data tool, no schema change needed.
