

## Plan: Preserve Item Order on Quotes and Invoices

### Problem
Items on quotes are fetched sorted alphabetically by name, and sale items have no guaranteed order. The drag-and-drop arrangement from creation/editing is lost.

### Database Changes
Add a `sort_order` integer column (default 0) to both tables:
- `quote_items` — add `sort_order INTEGER NOT NULL DEFAULT 0`
- `sale_items` — add `sort_order INTEGER NOT NULL DEFAULT 0`

### Code Changes

**`src/hooks/useQuotes.ts`**
- Change `.order('item_name', { ascending: true })` to `.order('sort_order', { ascending: true })`
- In `createQuote` and `updateQuote`, pass `sort_order: index` when inserting each item (using the array index from the loop)

**`src/hooks/useSales.ts`**
- When fetching sale items, add `.order('sort_order', { ascending: true })`
- In `createSale` and `updateSale`, pass `sort_order: index` when inserting each item

**`src/components/EditSaleDialog.tsx`**
- No changes needed (items are already in array order)

### Technical Details
- Items inserted with `sort_order` matching their array position (0, 1, 2, ...)
- All inserts use `as any` cast already, so the new column works immediately before types regenerate
- Existing items get `sort_order = 0` by default; they'll maintain their current DB insertion order as a tiebreaker via `created_at`

