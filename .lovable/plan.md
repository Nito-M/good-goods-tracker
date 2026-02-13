

## Add Total Cost of Needed Items Summary by Category

### What Changes
Add a summary section at the top of the All Job Items page (above the category cards) showing the total cost of needed items per category, so you can quickly see how much you need to spend.

### Formula
**Category Need Cost = SUM( need * unitPrice )** for each item in the category, where `need = Math.max(0, totalQty - inStock)` (only items with inventory data).

### File to Update

**`src/pages/AllJobItems.tsx`**

1. Compute a summary from `groupedItems` and `inventoryQtys`: for each category, sum up `need * unitPrice` for all items where inventory data is available and need > 0.
2. Also compute a grand total across all categories.
3. Render a summary section between the header and the category cards:
   - A row of small stat cards (or a compact list) showing each category name and its total need cost, styled with `formatCurrency`.
   - A bold grand total line.
4. Only show this summary when there are items and inventory data is loaded.

### Layout
```text
+--------------------------------------------------+
| Category A: $1,200  | Category B: $450  | ...    |
|                              Grand Total: $1,650  |
+--------------------------------------------------+
| [Existing category cards with tables below]       |
```

### Technical Details
- Use a `useMemo` that iterates `groupedItems`, looks up each item's inventory qty from `inventoryQtys`, calculates need, and sums `need * unitPrice` per category.
- Render as a `Card` with flex-wrap badges or stat blocks for each category.
- Grand total highlighted with slightly larger/bolder text.

