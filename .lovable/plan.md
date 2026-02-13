
## Add Collapsible Category Grouping to All Job Items

### What Changes
Apply the same collapsible-by-category pattern used in Job Detail to the All Job Items page, so items are grouped under expandable/collapsible category headers with item counts and subtotals.

### Files to Update

**1. `src/hooks/useJobs.ts`** (useAllJobItems function)
- Join `inventory_items` table to fetch the `category` field for each item
- Map the category into the returned item objects (currently hardcoded as `null`)

**2. `src/pages/AllJobItems.tsx`**
- Add `category` to the aggregated item type
- Group aggregated items by category using `useMemo`
- Add `collapsedCategories` state (Set) and a `toggleCategory` function
- Replace the flat table with collapsible category sections, each showing:
  - Category name, item count badge, and subtotal
  - A chevron icon that rotates when collapsed
  - The existing table (Item Name, SKU, Total Qty, In Stock, Unit Price, Jobs) nested inside each section
- Import `ChevronDown` from lucide-react and `Badge` from UI components

### Visual Pattern
Each category section will look identical to the Job Detail grouping:
- A clickable header bar with category name, count badge, and subtotal
- Expandable table rows underneath
- Collapsed by default via chevron rotation
