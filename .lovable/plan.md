

## Add "Ordered" and "In Stock" Indicators to Job Items

### What It Does
Each line item in the Job Detail view will show status badges indicating:
- **"Ordered"** badge (blue) -- if a Purchase Order linked to this job contains an item with a matching SKU
- **"In Stock"** badge (green) -- if the linked inventory item currently has quantity > 0

These appear alongside the existing "Reserved" badge in the Stock column, giving a quick visual summary of each item's procurement status.

### How It Works

**Detecting "Ordered"**: Query `purchase_orders` where `job_id` matches the current job, then check if any PO's `items` array contains a SKU matching the job item's SKU. Only POs with status `ordered` or `draft` count (received POs have already been fulfilled).

**Detecting "In Stock"**: Query `inventory_items` for the linked `inventory_item_id` and check if `quantity > 0`.

### Visual Layout (Stock Column)

```text
| Stock                          |
|--------------------------------|
| [Reserved] [Ordered] [In Stock] |   <- can show multiple badges
| [Reserve btn] [Ordered]         |   <- not yet reserved, but ordered
| [Reserve btn] [In Stock]        |   <- in stock, not ordered
| [Reserve btn]                   |   <- neither ordered nor in stock
```

### Technical Changes

**1. `src/pages/Jobs.tsx` (JobDetail component)**

- Add state for `orderedSkus` (a `Set<string>` of SKUs found in POs linked to this job)
- Add state for `inventoryQtys` (a `Record<string, number>` mapping inventory_item_id to quantity)
- On mount / when `job.id` changes, fetch:
  - `purchase_orders` where `job_id = job.id` and `status` in ('draft', 'ordered') -- extract SKUs from the `items` JSON array
  - `inventory_items` where `id` in (all inventoryItemIds from job items) -- get current quantities
- In the table row, after the existing Reserve/Reserved UI, conditionally render:
  - A blue "Ordered" badge if the item's SKU is in `orderedSkus`
  - A green "In Stock" badge if `inventoryQtys[item.inventoryItemId] > 0`

**2. No database changes required** -- all data already exists; we just need to query it.

**3. No hook changes required** -- the fetches will be local to the JobDetail component using direct Supabase queries, keeping the implementation simple and self-contained.

