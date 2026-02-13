

## Add "Reserve from Stock" Button to Job Items

### What It Does
Each item in the Job Detail view gets a **"Reserve"** button. When pressed:
1. Checks if the inventory has enough stock for the item's quantity
2. If yes: deducts the quantity from inventory stock and marks the job item as **"Reserved"**
3. If no: shows a warning that there isn't enough stock
4. Once reserved, the button changes to show "Reserved" status (with an option to unreserve/return to stock)

### Database Change

**Add a `reserved` boolean column to `job_items` table** (default `false`)

```sql
ALTER TABLE public.job_items ADD COLUMN reserved boolean NOT NULL DEFAULT false;
```

This is simpler than a full status field since we just need a toggle between reserved and not reserved.

### File Changes

**1. `src/types/job.ts`**
- Add `reserved: boolean` to the `JobItem` interface

**2. `src/hooks/useJobs.ts`**
- Map the new `reserved` field in the `useJobItems` hook fetch
- Add a `reserveItem(jobItemId)` function that:
  - Looks up the job item to get its `inventoryItemId` and `quantity`
  - Fetches current inventory stock
  - If stock >= quantity: updates inventory (stock - quantity) and sets `job_items.reserved = true`
  - If stock < quantity: returns an error / shows toast
- Add an `unreserveItem(jobItemId)` function that reverses the process (adds quantity back to stock, sets reserved = false)

**3. `src/pages/Jobs.tsx` (JobDetail component)**
- Add a "Reserve" button column to the job items table (or integrate into existing action column)
- When `reserved = false` and item has an `inventoryItemId`: show a green "Reserve" button
- When `reserved = true`: show a "Reserved" badge with an undo/return button
- Items without a linked inventory item: show a disabled/greyed state
- The button triggers `reserveItem` or `unreserveItem` from the hook

### Table Layout After Change
| Thumb | Item | SKU | Price | Qty | Total | Status | Actions |

The "Status" area shows either a "Reserve" button or a "Reserved" badge with undo option.
