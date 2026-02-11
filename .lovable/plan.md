# Add Combined Items List Button to Jobs Page

## Overview

Add a "View All Items" button in the Jobs page header that opens a dialog showing all items across all jobs combined. Items with the same SKU/name are aggregated, showing the total quantity needed across jobs.

## Changes

### File: `src/pages/Jobs.tsx`

1. **Add a new state** `showAllItemsDialog` to control the dialog visibility.
2. **Fetch all job (except finished Jobs), items**: Query `job_items` table for all items belonging to the user's jobs. This will be done with a `useEffect` that fetches from `supabase.from('job_items').select('*, jobs!inner(title, job_number)')` joining job info, when the dialog opens.
3. **Aggregate items by SKU**: Group items by `inventory_item_id` (or by `item_name + sku` for items without an inventory link), summing quantities across jobs. Each aggregated row shows: item name, SKU, total quantity needed, unit price, and which jobs need it.
4. **Add button in header** (line ~229, next to "New Job"): A `List` icon button labeled "All Items" that opens the dialog.
5. **Add dialog**: A `Dialog` showing a `Table` with columns:
  - Item Name
  - SKU
  - Total Qty
  - Unit Price
  - Jobs (comma-separated job numbers)

### File: `src/hooks/useJobs.ts`

Add a new exported hook `useAllJobItems()` that fetches all job items with their job titles/numbers using a join query, avoiding the need to call `useJobItems` for each individual job.

### No database changes needed

The `job_items` table already has all the data. We just need a query that fetches across all jobs.

&nbsp;